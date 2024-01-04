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
package com.github.cowwoc.lumina.exception;

import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.io.Serial;

/**
 * Thrown if the server response did not contain a required property.
 */
public final class NoSuchPropertyException extends IOException
{
	@Serial
	private static final long serialVersionUID = 0L;

	/**
	 * @param object the object that was supposed to contain the property
	 * @param name   the name of the property
	 * @throws NullPointerException if any of the arguments are null
	 */
	public NoSuchPropertyException(ObjectNode object, String name)
	{
		super(getMessage(object, name));
	}

	/**
	 * @param object the object that was supposed to contain the property
	 * @param name   the name of the property
	 * @return the exception message
	 * @throws NullPointerException if any of the arguments are null
	 */
	private static String getMessage(ObjectNode object, String name)
	{
		return "Could not find any property with a name of \"" + name + "\".\n" +
			"object: " + object;
	}
}