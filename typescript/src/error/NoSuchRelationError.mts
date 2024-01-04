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
 * Thrown if the server response did not contain a required relation.
 */
class NoSuchRelationError extends Error
{
	/**
	 * @param from - the object that the search began at
	 * @param relation - the relation between a resource and the matching resources
	 * @throws TypeError if any of the arguments are null
	 */
	public constructor(from: ObjectNode, relation: string)
	{
		super(NoSuchRelationError.getMessage(from, relation));
	}

	/**
	 * @param from - the object that the search began at
	 * @param relation - the relation between a resource and the matching resources
	 * @returns the exception message
	 * @throws TypeError if any of the arguments are null
	 */
	private static getMessage(from: ObjectNode, relation: string)
	{
		return `Could not find any resources with relation "${relation}".
from: ${JSON.stringify(from, null, 2)}`;
	}
}

export {NoSuchRelationError};