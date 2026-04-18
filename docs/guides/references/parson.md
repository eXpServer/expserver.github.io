# Parson JSON Library Usage in eXpServer

The eXpServer project uses the `Parson` library, a simple JSON parser written in C, to read configuration files like `xps_config.json`.

This library is a copy of the work at https://github.com/kgabis/parson and is Copyrighted by [kgabis](https://github.com/kgabis/) (c) 2014.
[MIT License](https://github.com/kgabis/parson/blob/master/LICENSE)

## Installation

Go to `expserver/src/lib/` and run the following commands:

```bash
mkdir parson
cd parson

curl -O https://raw.githubusercontent.com/eXpServer/parson/master/README.md
curl -O https://raw.githubusercontent.com/eXpServer/parson/master/parson.h
curl -O https://raw.githubusercontent.com/eXpServer/parson/master/parson.c
```

## Core Types

There are three main structs in Parson:

### `JSON_Value`
This is the "skeleton" of every JSON element. It tells Parson what **type** the data is and holds a pointer to the actual data.

```c
struct json_value_t {
...
    JSON_Value_Type  type;  // Is it a String, Number, Object, etc.?
    JSON_Value_Value value; // The actual data (a Union)
};
```

The `value` field is a **Union**, which means it can hold exactly ONE of these things at a time:
```c
typedef union json_value_value {
	...
    char        *string;
    double       number;
    JSON_Object *object;
    JSON_Array  *array;
    int          boolean;
} JSON_Value_Value;
```

### `JSON_Object` 
When a `JSON_Value` says its type is `JSONObject`, it points to this structure. It manages a collection of keys and their corresponding values and the values being `JSON_Value` structures.

```c
struct json_object_t {
	...
    char       **names;  // Array of key strings (e.g., "port", "host")
    JSON_Value **values; // Array of boxes holding the data for those keys
    size_t       count;  // How many keys are in this object
};
```

### `JSON_Array`
When a `JSON_Value` is a `JSONArray`, it points to a simple list of other `JSON_Value` structures.

```c
struct json_array_t {
	...
    JSON_Value **items; // A simple C-style array of values
    size_t       count; // Number of items in the list
};
```

In OOPS terms, `JSON_Value` is like a generic `Base Class` and `JSON_Object` and `JSON_Array` are like `Derived Class` objects. 

## JSON_Value Methods

### `json_parse_file`
Reads a JSON file and returns (`JSON_Value*`) that contains the entire content.

```c 
JSON_Value *json_parse_file(const char *filename);
```
- **Arguments**:
  - `filename`: The path to the `.json` file.
- **Returns**: A pointer to a `JSON_Value` that represents the entire parsed JSON structure. Returns `NULL` if the file is missing or invalid.

When you call `json_parse_file`, it looks at the very start of your file. Since a JSON file can be a single number, a string, or a large object, Parson always returns a **`JSON_Value*`**.

So after getting the `JSON_Value` struct object from `json_parse_file()`, methods like `json_value_get_object()`, `json_value_get_array()`, etc.. are used to resolve it into the actual object or array. In our case we use `json_value_get_object()` as our config file `xps_config.json` starts with `{` and ends with `}` which implies it is an object.

:::info NOTE
Since a JSON file can start with any valid data type (an object, an array, a string, or a number), the parser returns a generic `JSON_Value` struct object. We then must use the appropriate method to resolve it into the intended object or array.
:::

### `json_value_get_object`

Gets the main `JSON_Object` from a `JSON_Value`. Since our `xps_config.json` starts with `{}` we can use this function. If it had been starting with `[]` then that would imply the file starts as an array of object so we would have to use `json_value_get_array()` instead.


```c
JSON_Object *json_value_get_object(const JSON_Value *value);
```

- **Arguments**:
  - `value`: The `JSON_Value` to check.
- **Returns**: A pointer to a `JSON_Object`.

Once you have a `JSON_Object`, you can get specific fields using the key name.

### `json_value_get_array`


Gets the `JSON_Array` from a `JSON_Value`. This is used if your JSON file starts with an array (`[...]`) instead of an object.


```c
JSON_Array *json_value_get_array(const JSON_Value *value);
```

- **Arguments**:
  - `value`: The `JSON_Value` to check.
- **Returns**: A pointer to a `JSON_Array`.

### `json_value_free`
Frees the memory used by the parsed JSON.

```c
void json_value_free(JSON_Value *value);
```
- **Arguments**:
  - `value`: The `JSON_Value` to free.
<!-- - **Usage in eXpServer**: Used during server shutdown to prevent memory leaks. -->

## JSON_Object Methods

### `json_object_get_string`
Gets a string value for a specific key.


```c
const char *json_object_get_string(const JSON_Object *object, const char *name);
```

- **Arguments**:
  - `object`: The `JSON_Object` to search in.
  - `name`: The key string (like `"server_name"`).
- **Returns**: The string, or `NULL` if the key doesn't exist.

### `json_object_get_number`
Gets a number value for a specific key.


```c
double json_object_get_number(const JSON_Object *object, const char *name);
```

- **Returns**: A number (which we often treat as an `int` or `size_t` in eXpServer for things like `port` or `workers`). Returns `0` on fail.

### `json_object_get_boolean`
Gets a boolean (true/false) value for a specific key.


```c
int json_object_get_boolean(const JSON_Object *object, const char *name);
```

- **Returns**: `1` for true, `0` for false, or `-1` if it fails.
<!-- - **Usage in eXpServer**: Used to check the `gzip_enable` setting. -->

### `json_object_get_array`
Gets a JSON array for a specific key.


```c
JSON_Array *json_object_get_array(const JSON_Object *object, const char *name);
```

- **Returns**: A pointer to `JSON_Array`, or `NULL` if it doesn't exist.
<!-- - **Usage in eXpServer**: Used to get lists like `"servers"`, `"routes"`, or `"hostnames"`. -->

## JSON_Array Methods

Once you have a `JSON_Array`, you can find out how big it is and loop through it.

### `json_array_get_count`
Gets the total number of items in an array.


```c
size_t json_array_get_count(const JSON_Array *array);
```

- **Returns**: The size of the array.
<!-- - **Usage in eXpServer**: Used as the limit in `for` loops when going through routes or servers. -->

### `json_array_get_object`
Gets a `JSON_Object` at a specific position (index) in an array.


```c
JSON_Object *json_array_get_object(const JSON_Array *array, size_t index);
```

- **Arguments**:
  - `array`: The `JSON_Array`.
  - `index`: The position (starting from 0).
- **Returns**: The `JSON_Object` at that position.
<!-- - **Usage in eXpServer**: Getting individual `"route"` items out of the main routes array. -->

### `json_array_get_string`
Gets a string at a specific position in an array.


```c
const char *json_array_get_string(const JSON_Array *array, size_t index);
```

- **Returns**: The string at that position.
<!-- - **Usage in eXpServer**: Reading plain lists of strings, like the hostnames or `ip_whitelist` addresses. -->

## Usage

Provided below is an example of how these methods are used together to read a configuration:

```c
// 1. Read the file
JSON_Value *config_val = json_parse_file("config.json");

// 2. Get the main object
JSON_Object *config_obj = json_value_get_object(config_val);

// 3. Get simple values
const char *name = json_object_get_string(config_obj, "server_name");

// 4. Get an array and loop through it
JSON_Array *routes = json_object_get_array(config_obj, "routes");
for (size_t i = 0; i < json_array_get_count(routes); i++) {
    // Get the object at this position
    JSON_Object *route = json_array_get_object(routes, i);
    const char *path = json_object_get_string(route, "req_path");
}

// 5. Clean up memory
json_value_free(config_val);
```
