/*
 * Copyright (c) 2024 Gili Tzabari
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import path from "path";
import {ESLint} from "eslint";
import TypeDoc from "typedoc";
import fs from "node:fs";
import {spawn} from "child_process";
import glob from "fast-glob";
import ts from "typescript";
import eslintConfig from "../.eslintrc.mjs";
import {mode} from "./mode.mjs";
import parseArgs from "minimist";
import {diary, enable as enableDiaries} from "diary";
import url from "url";


class Project
{
	/**
	 * @param sources the files to lint
	 * @private
	 */
	private async lintTypescript(sources: string[])
	{
		console.time("lintTypescript");
		const eslint = new ESLint({
			baseConfig: eslintConfig,
			cache: true,
			"overrideConfig": {
				parserOptions: {
					debugLevel: false
				}
			}
		});
		let results;
		try
		{
			results = await eslint.lintFiles(sources);
			const formatter = await eslint.loadFormatter("stylish");
			const resultText = await formatter.format(results);
			if (resultText)
				log.info(resultText);
		}
		catch (error)
		{
			log.error(`Lint error: ${error}`);
			throw error;
		}

		for (const result of results)
		{
			if (result.errorCount > 0)
				throw new Error("lintTypescript failed");
		}
		console.timeEnd("lintTypescript");
	}

	/**
	 * @param sources - the files to compile
	 * @private
	 */
	private async bundleTypescript(sources: string[])
	{
		console.time("bundleTypescript");
		try
		{
			await Promise.all([this.lintTypescript(sources), this.compileTypescript(sources)]);
		}
		catch (error)
		{
			log.error(`bundleForNode error: ${error}`);
			throw error;
		}
		console.timeEnd("bundleTypescript");
	}

	/**
	 * @param sources the files to compile
	 * @private
	 */
	private async compileTypescript(sources: string[])
	{
		console.time("compileTypescript");
		// Example of compiling using API: https://gist.github.com/jeremyben/4de4fdc40175d0f76892209e00ece98f
		const cwd = process.cwd();
		const configFile = ts.findConfigFile(cwd, ts.sys.fileExists, "tsconfig.json");
		if (!configFile)
			throw Error("tsconfig.json not found");
		const {config} = ts.readConfigFile(configFile, ts.sys.readFile);
		config.compilerOptions.outDir = "target/classes/node/";
		config.compilerOptions.declaration = true;
		config.include = undefined;
		config.files = sources;

		const {
			options,
			fileNames,
			errors
		} = ts.parseJsonConfigFileContent(config, ts.sys, cwd);
		const program = ts.createProgram({
			options,
			rootNames: fileNames,
			configFileParsingDiagnostics: errors
		});

		const {
			diagnostics,
			emitSkipped
		} = program.emit();

		const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(diagnostics, errors);
		if (allDiagnostics.length)
		{
			const formatHost: ts.FormatDiagnosticsHost = {
				getCanonicalFileName: (path) => path,
				getCurrentDirectory: ts.sys.getCurrentDirectory,
				getNewLine: () => ts.sys.newLine
			};
			const message = ts.formatDiagnostics(allDiagnostics, formatHost);
			log.warn(message);
		}
		if (emitSkipped)
			throw new Error("compileTypescript() failed");
		console.timeEnd("compileTypescript");
	}

	public async generateDocumentation()
	{
		console.time("generateDocumentation");
		const targetDirectory = "target/classes/apidocs/";

		const app = await TypeDoc.Application.bootstrapWithPlugins({}, [
			new TypeDoc.TypeDocReader(),
			new TypeDoc.TSConfigReader()
		]);

		const project = await app.convert();
		if (!project)
			throw new Error("generateDocumentation() failed");
		app.validate(project);
		if (app.logger.hasErrors())
			throw new Error("generateDocumentation failed");
		await app.generateDocs(project, targetDirectory);
		if (app.logger.hasErrors())
			throw new Error("generateDocumentation failed");
		console.timeEnd("generateDocumentation");
	}

	/**
	 * @param sources - the resources in the project
	 * @private
	 */
	public async bundleResources(sources: string[])
	{
		console.time("bundleResources");
		const targetDirectory = "target/classes/node/";
		if (!fs.existsSync(targetDirectory))
			fs.mkdirSync(targetDirectory, {recursive: true});
		let promises: Promise<void>[] = [];

		try
		{
			for (const source of sources)
			{
				const target = targetDirectory + path.posix.basename(source);
				promises.concat(fs.promises.copyFile(source, target));
			}
			await Promise.all(promises);
		}
		catch (error)
		{
			log.error(`bundleResources error: ${error}`);
			throw error;
		}
		console.timeEnd("bundleResources");
	}

	public async test()
	{
		console.time("test");
		const binPath = path.posix.resolve("./node_modules/.bin");
		const c8Path = path.posix.resolve(binPath + "/c8");
		const mochaPath = path.posix.resolve(binPath + "/mocha");

		// https://stackoverflow.com/a/53204227/14731
		const promise = new Promise(function (resolve, reject)
		{
			// https://stackoverflow.com/a/14231570/14731
			const process = spawn(c8Path, [mochaPath, "./test/**/*.mts", "--mode=" + mode],
				{
					shell: true,
					stdio: "inherit"
				});
			process.on("error", function (err)
			{
				reject(err);
			});
			process.on("close", function (code)
			{
				if (code !== 0)
					reject(new Error(`Exit code: ${code}`));
				resolve(undefined);
			});
		});
		try
		{
			await promise;
		}
		catch (error)
		{
			log.error(`bundleForBrowser error: ${error}`);
			throw error;
		}
		console.timeEnd("test");
	}

	private async getTypescriptFiles()
	{
		return [...await glob.glob("src/**/*.mts")];
	}

	public async build()
	{
		console.time("build");
		const typescriptFiles = await this.getTypescriptFiles();
		await this.bundleTypescript(typescriptFiles);
		// REMINDER: If the tests return "ERROR: null" it means that the test files could not be compiled, or two
		// tests had the same name.
		await Promise.all([this.generateDocumentation(),
			this.bundleResources(this.getResourceFiles())]);
		//, await this.test()]);
		console.timeEnd("build");
	}

	/**
	 * @returns the resources in the project
	 * @private
	 */
	private getResourceFiles()
	{
		return [
			"package.json",
			"README.md"
		];
	}
}

enableDiaries("*");
// Use POSIX paths across all platforms
const posixPath = url.fileURLToPath(import.meta.url).split(path.sep).join(path.posix.sep);
const __filename = path.posix.basename(posixPath);
const log = diary(__filename);

console.time("Time elapsed");
const project = new Project();
const command = parseArgs(process.argv.slice(2));
switch (command._[0])
{
	case "build":
	{
		await project.build();
		break;
	}
}
console.timeEnd("Time elapsed");