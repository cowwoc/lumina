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

/**
 * The relation between a resource and one of its properties.
 */
enum Relation
{
	/**
	 * The parent resource in the hierarchy of resources.
	 */
	PARENT = "parent",
	/**
	 * Form for creating a new resource.
	 */
	FORM_CREATE = "formCreate",
	/**
	 * Form for updating an existing resource.
	 */
	FORM_UPDATE = "formUpdate",
	/**
	 * Form for deleting a resource.
	 */
	FORM_DELETE = "formDelete"
}

export {Relation};