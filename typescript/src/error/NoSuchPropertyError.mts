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
import type {ObjectNode} from "../Json.mjs";

/**
 * Thrown if the server response did not contain a required property.
 */
class NoSuchPropertyError extends Error
{
	/**
	 * @param object - the object that was supposed to contain the property
	 * @param name - the name of the property
	 * @throws TypeError if any of the arguments are null
	 */
	public constructor(object: ObjectNode, name: string)
	{
		super(NoSuchPropertyError.getMessage(object, name));
	}

	/**
	 * @param object - the object that was supposed to contain the property
	 * @param name - the name of the property
	 * @returns the exception message
	 * @throws TypeError if any of the arguments are null
	 */
	private static getMessage(object: ObjectNode, name: string)
	{
		return `Could not find any property with a name of "${name}".
object: ${JSON.stringify(object, null, 2)}`;
	}
}

export {NoSuchPropertyError};