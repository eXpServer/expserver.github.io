# Tests - GZIP Compression Module

## Overview

These tests verify that the GZIP compression module correctly compresses HTTP responses and preserves the original response data.

---

## Test 1: GZIP Compression Enabled

```js
testInput: 'Client requests a text file with Accept-Encoding: gzip'

expectedBehavior: 'Server responds successfully and includes the Content-Encoding: gzip header'
```

This verifies that GZIP compression is enabled when the client advertises support for it.

---

## Test 2: GZIP Response Decompression

```js
testInput: 'Client requests a text file with Accept-Encoding: gzip and saves the response body'

expectedBehavior: 'The received response can be successfully decompressed as a GZIP stream'
```

This verifies that the server generates a valid GZIP stream.

---

## Test 3: Decompressed Content Matches Original

```js
testInput: 'Client requests a file with Accept-Encoding: gzip, decompresses the response, and compares it with the original file'

expectedBehavior: 'The decompressed response is identical to the original file'
```

The comparison should be byte-for-byte to ensure that compression does not corrupt or modify the response.

---

## Test 4: Client Does Not Support GZIP

```js
testInput: 'Client requests a text file without advertising GZIP support'

expectedBehavior: 'Server sends the normal uncompressed response and does not include Content-Encoding: gzip'
```

This verifies that the server does not send compressed data to clients that have not requested or accepted it.

---

## Test 5: Large File Compression

```js
testInput: 'Client requests a large text file with Accept-Encoding: gzip'

expectedBehavior: 'Server returns a valid GZIP response that can be completely decompressed and matches the original large file'
```

This test is important because the compressed output may be larger than a single output buffer.

The compressor must therefore correctly handle multiple calls to `deflate()` and multiple output buffers.


---

## Test 6: GZIP Stream Finalization

```js
testInput: 'Client requests a file with Accept-Encoding: gzip and waits until the complete response is received'

expectedBehavior: 'The complete response can be decompressed successfully, including the final bytes of the file'
```

This verifies that the compression stream is correctly finalized when the input ends.

The expected flow is:


This test is particularly important for ensuring that the GZIP trailer and any remaining compressed data are generated correctly.
