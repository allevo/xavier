# Xavier

This is a test framework that help you to valutate your test suite.
Given a command, this framework runs your tests editing your code.
If your test asserts the correct values, your tests fail.
Otherwise all tests run correctly and your tests aren't able to listen to the changes.
Please read [this](http://en.wikipedia.org/wiki/Mutation_testing) for more informations.


## How to integrate
```
npm install --save-dev xavier
```

The mutation tests are very slow to run, because they need to run all test suites to find the tests that fail.
This is why, the mutation tests should be used only when you are done and you would find some bugs.

Create a simple file as configuration like this
```json
{
  "projectDir": "/path/to/project",
  "testDir": "test",
  "mutationDir": "/path//to/tmp",
  "toIgnore": [
    "node_modules",
    "test",
    "jsonschemas",
    "coverage"
  ],
  "toKeep": [
    "\\.js$"
  ],
  "command": ["npm", ["run-script", "test-bail"]],
  "usedProcess": 1
}

```
Where
* __projectDir__ is the path of your project
* __testDir__ is the relative or absolute path of your tests
* __mutationDir__ is a directory where xavier can write
* __toIgnore__ is an array of regural expressions that are used to exclude some paths/files
* __toKeep__ is an array of regural expressions used to filter the paths to keep
* __command__ is the command used to run the tests. Please consider to use "stop-on-first-failure" approach.
* __usedProcess__ is the number of the process that runs in the same time. If you test some http server, use 1.

On the head of your test files, insert this require:
```javascript
require('xavier');
```
This is required to run the mutations instead of your code.
If no mutations are running, this require does nothing.

## Run
```
./node_modules/.bin/xavier /path/to/conf
```
Use `-vv` to more output. Add more `v` for more verbose output.

Use `-m 3` to run only first three tests (useful if you)


## Which mutations are implemented

The follow list represents which mutations are implemented. Not all are important, not all important mutations are implmented.

* Remove a function call: `[1, 2, 3, 4].join('');` become `[1, 2, 3, 4];`
* Change comparison operators: `if (a >= b)` become `if (a > b)` for all possible comparison operators
* Change binary algebric operators: `a = b + c;` become `a = b / c;` for all other three operators
* The `!` operator is removed
* Logical operators are changed

This framework doesn't perform all permutation of a binary expression. For example
```javascript
if (a || b > 5 || (c && d < 6))
```
has 3 mutations for each logical operators (`||` and `&&`) and 7 * 2 = 14 for comparison operator (`>` and `<`)


## Are you interested?
This is at the beginning.
More mutations are needed.
So, if you are interested, please make a pull request or open an issue!
