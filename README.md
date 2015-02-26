# mutation-test-js

This is a test framework that help you to valutate your test suite.
Given a command, this framework run your tests editing your code.
If your test asserts the correct values, your tests fail.
Otherwise all tests run correctly and your test aren't able to catch the changes.

## How to integrate
The mutation tests are very slow to run, because need to run all test suite to find the test that fails.
This is why, the mutation test should be used only when you are done and you would find some bugs.

Create a simple file as configuration like this
```json
{
	"directory": "/path/to/your/project",
	"toIgnore": [
		"node_modules",
		"test",
		".git",
		"coverage"
	],
	"toKeep": [
		"\.js$"
	],
	"usedProcess": 1
}
```
Where
* __directory__ is the path of your project
* __toIgnore__ is an array of regural expression that is used to exclude some paths
* __toKeep__ is an array of regural expression used to filter the paths to keep
* __usedProcess__ is the number of the process used to spawn your tests


## Which mutations are implemented

The follow list represent which mutations are implemented. Not all are important, not all important mutations are implmented.

* Remove a function call `[1, 2, 3, 4].join('');` become `[1, 2, 3, 4];`
* Change comparison operators `if (a >= b)` become `if (a > b)` for all possible comparison operators
* Change binary algebric operators `a = b + c;` become `a = b / c;` for all other three operators
* Not operator is removed
* Logical operators are changed

This framework doesn't perform all permutation of a binary expression. For example
```javascript
if (a || b > 5 || (c && d < 6))
```
has 3 mutations for each logical operators (`||` and `&&`) and 7 * 2 = 14 for comparison operator (`>` and `<`)


## Are you interested?
This is at the beginning. More mutations is needed. So, if you are interested, please make a pull request or open an issue!
