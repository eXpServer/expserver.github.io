# MIME types

A **media type** (also known as a **Multipurpose Internet Mail Extensions or MIME type**) indicates the nature and format of a document, file, or assortment of bytes.

The [Internet Assigned Numbers Authority (IANA)](https://www.iana.org/) is responsible for all official MIME types, and you can find the most up-to-date and complete list at their [Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml) page.

## **What type is my data?**

Bytes are just numbers. So when the client (eg. web browser) receives a stream of bytes from the server, how can it tell if this is Unicode HTML data, binary animated-gif data, or a JPEG vacation photograph? They're all just streams of numbers!

The server has to tell the browser what type this data is. And it does this by specifying the MIME type.

::: details Common MIME types:

- JPEG: `image/jpeg`
- GIF: `image/gif`
- PNG: `image/png`
- JavaScript: `application/javascript`
- JSON: `application/json`
- CSS: `text/css`
- HTML: `text/html`
- Plain TXT: `text/plain`
- Non-descript data: `application/octet-stream`

:::

## **How to determine the type of data served?**

### **Programmatic endpoints**

If you have a programmatic endpoint (e.g. an endpoint that generates the data instead of reading it from disk) then you simply specify the type of the data you're sending back.

For example, if you return data is:

```JSON
{
    "animal_type": "goat",
    "count": 37
}
```

then you'll use the content type of `application/json`.

### **File serving**

But what if you're reading data from a file and serving it?

If the client requests `http://example.com/foo.png`, we need to reply with a type of `image/png`. The usual way to do this is to simply map between the file extension `.png` and its MIME type `image/png`.

1. Isolate the file extension.
   - Examples:
     - File is `frotz.jpg`, extension is `.jpg`.
     - File is `foo.bar.txt`, extension is `.txt`.
2. Map the extension to its MIME type.
   - Example:
     - `.txt` maps to `text/plain`
3. If you can't find a mapping for an extension, use `application/octet-stream`.

## **How is the MIME type returned?**

It comes back in the HTTP header in the `Content-Type` field:

```HTTP
Content-Type: text/html
```

Webservers construct their own HTTP headers so the `Content-Type` is included at that time.

## Structure of MIME type

A MIME type most commonly consists of just two parts: a *type* and a *subtype*, separated by a slash (`/`) — with no whitespace between:

```txt
type/subtype;parameter=value
```

The **_type_** represents the general category into which the data type falls, such as `video` or `text`.

The **_subtype_** identifies the exact kind of data of the specified type the MIME type represents.

- For example, for the MIME type `text`, the subtype might be `plain`, `html`, or `calendar`.

An optional **_parameter_** can be added to provide additional details.

- For example, for any MIME type whose main type is `text`, you can add the optional `charset` parameter to specify the character set used for the characters in the data. If no `charset` is specified, the default is [ASCII](https://developer.mozilla.org/en-US/docs/Glossary/ASCII) . To specify a UTF-8 text file, the MIME type `text/plain;charset=UTF-8` is used.
