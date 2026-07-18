# 207. Course Schedule

There are `numCourses` courses you have to take, labeled from `0` to
`numCourses - 1`. You are given an array `prerequisites` where
`prerequisites[i] = [a, b]` means you must take course `b` before course `a`.

Return `true` if you can finish all courses. Otherwise, return `false`.

## Example 1

Input: numCourses = 2, prerequisites = [[1,0]]  
Output: true

## Example 2

Input: numCourses = 2, prerequisites = [[1,0],[0,1]]  
Output: false

## Constraints

- `1 <= numCourses <= 2000`
- `0 <= prerequisites.length <= 5000`
- `prerequisites[i].length == 2`
- `0 <= ai, bi < numCourses`
