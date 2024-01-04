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
package com.github.cowwoc.lumina.util;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * String helper functions.
 */
public class Strings
{
	private static final Pattern WORD_SEPARATOR = createWordSeparator();

	private static Pattern createWordSeparator()
	{
		String nonAlphabet = "[^a-zA-Z]+";
		String lowercaseBehind = "(?<=[a-z])";
		String uppercaseAhead = "(?=[A-Z])";
		return Pattern.compile(nonAlphabet + "|" + lowercaseBehind + uppercaseAhead);
	}

	private Strings()
	{
	}

	/**
	 * Converts a string to Camel Case which has the following format: {@code contentType}. The behavior is
	 * undefined for non-ASCII input.
	 *
	 * @param source a ASCII string
	 * @return the updated string
	 * @throws NullPointerException if {@code source} is null
	 */
	public static String toCamelCase(String source)
	{
		StringBuilder target = new StringBuilder(source.length());
		for (String token : WORD_SEPARATOR.split(source))
		{
			if (token.isEmpty())
				continue;
			target.append(Character.toTitleCase(token.charAt(0))).
				append(token.substring(1).toLowerCase(Locale.ENGLISH));
		}
		return target.toString();
	}
}
