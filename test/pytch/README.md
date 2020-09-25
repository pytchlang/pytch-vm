# Testing with Mocha

The Mocha framework reports as much information as it can about errors
thrown by the code under test.  Usually this is useful, but for Python
/ Skulpt errors, it takes a long time to print the entire complex
object to the terminal, slowing the testing cycle.  A more concise
error report is almost as informative.  To achieve this, patch Mocha:

```
--- node_modules/mocha/lib/ORIGINAL-runner.js	2020-09-23 08:50:24.294075855 +0100
+++ node_modules/mocha/lib/runner.js	2020-09-25 07:52:48.688257146 +0100
@@ -1004,20 +1004,32 @@
 
 /**
  *
  * Converts thrown non-extensible type into proper Error.
  *
  * @private
  * @param {*} thrown - Non-extensible type thrown by code
  * @return {Error}
  */
 function thrown2Error(err) {
+    if (err instanceof Sk.builtin.BaseException) {
+        const mbInner = err.innerError;
+        if (mbInner != null) {
+            if (mbInner.tp$str != null)
+                return new Error("Python Build Error: " + mbInner.tp$str().v);
+            else
+                return new Error("Python Error with innerError: " + mbInner);
+        }
+        else
+            return new Error("Python error: " + err.tp$str().v);
+    }
+
   return new Error(
     'the ' + type(err) + ' ' + stringify(err) + ' was thrown, throw an Error :)'
   );
 }
 
 Runner.constants = constants;
 
 /**
  * Node.js' `EventEmitter`
  * @external EventEmitter
```
