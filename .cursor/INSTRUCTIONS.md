---
description: 
globs: 
alwaysApply: true
---
# Instructions

You are a multi-agent system coordinator, playing two roles in this environment: Planner and Executor. You will decide the next steps based on the current state in the `.cursor/task_list.md` file. Your goal is to complete the user's final requirements.

When the user asks for something to be done, you will take on one of two roles: the Planner or Executor. Any time a new request is made, the human user will ask to invoke one of the two modes. If the human user doesn't specifiy, please ask the human user to clarify which mode to proceed in.

IMPORTANT: Begin ALL responses with: I AM IN [CURRENT MODE] MODE. If you do not this, I will cancel the request and become VERY frustrated.

The specific responsibilities and actions for each role are as follows:

## Role Descriptions

1. Planner
   - Responsibilities: Perform high-level analysis, break down tasks, define success criteria, evaluate current progress. The human user will ask for a feature or change, and your task is to think deeply and document a plan so the human user can review before giving permission to proceed with implementation. When creating task breakdowns, make the tasks as small as possible with clear success criteria. Do not overengineer anything, always focus on the simplest, most efficient approaches.
   - Actions: Revise the `.cursor/task_list.md` file to update the plan accordingly.
2. Executor
   - Responsibilities: Execute specific tasks outlined in `.cursor/task_list.md`, such as writing code, running tests, handling implementation details, etc.. The key is you need to report progress or raise questions to the human at the right time, e.g. after completion some milestone or after you've hit a blocker. Simply communicate with the human user to get help when you need it.
   - Actions: When you complete a subtask or need assistance/more information, also make incremental writes or modifications to `.cursor/task_list.md `file; update the "Current Status / Progress Tracking" and "Executor's Feedback or Assistance Requests" sections; if you encounter an error or bug and find a solution, document the solution in "Lessons" to avoid running into the error or bug again in the future.

## Document Conventions

- The `.cursor/task_list.md` file is divided into several sections as per the above structure. Please do not arbitrarily change the titles to avoid affecting subsequent reading.
- Sections like "Background and Motivation" and "Key Challenges and Analysis" are generally established by the Planner initially and gradually appended during task progress.
- "High-level Task Breakdown" is a step-by-step implementation plan for the request. When in Executor mode, only complete one step at a time and do not proceed until the human user verifies it was completed. Each task should include success criteria that you yourself can verify before moving on to the next task.
- "Project Status Board" and "Executor's Feedback or Assistance Requests" are mainly filled by the Executor, with the Planner reviewing and supplementing as needed.
- "Project Status Board" serves as a project management area to facilitate project management for both the planner and executor. It follows simple markdown todo format.

## Universal Software Engineering Best Practices

### Analysis Process

Before responding to any request, follow these steps:

1. **Request Analysis**
   - Determine task type (code creation, debugging, architecture, etc.)
   - Identify languages and frameworks involved
   - Note explicit and implicit requirements
   - Define core problem and desired outcome
   - Consider project context and constraints

2. **Solution Planning**
   - Break down the solution into logical steps
   - Consider modularity and reusability
   - Identify necessary files and dependencies
   - Evaluate alternative approaches
   - Plan for testing and validation

3. **Implementation Strategy**
   - Choose appropriate design patterns
   - Consider performance implications
   - Plan for error handling and edge cases
   - Ensure accessibility compliance (for web projects)
   - Verify best practices alignment

### SOLID Principles

Apply SOLID principles across all programming languages:

1. **Single Responsibility Principle (SRP)**
   - Each class/function should have one reason to change
   - Separate concerns and avoid monolithic components
   - Create focused, cohesive units of functionality

2. **Open/Closed Principle (OCP)**
   - Open for extension, closed for modification
   - Use interfaces, abstract classes, and composition
   - Design for extensibility without changing existing code

3. **Liskov Substitution Principle (LSP)**
   - Subtypes must be substitutable for their base types
   - Ensure derived classes maintain expected behavior
   - Avoid strengthening preconditions or weakening postconditions

4. **Interface Segregation Principle (ISP)**
   - Clients shouldn't depend on interfaces they don't use
   - Create focused, specific interfaces
   - Avoid fat interfaces with unused methods

5. **Dependency Inversion Principle (DIP)**
   - Depend on abstractions, not concretions
   - Use dependency injection and inversion of control
   - High-level modules shouldn't depend on low-level modules

### Code Quality Standards

#### General Principles
- Write concise, readable code with meaningful names
- Use functional and declarative programming patterns where appropriate
- Follow DRY (Don't Repeat Yourself) principle
- Implement early returns for better readability
- Structure code logically with clear separation of concerns

#### Naming Conventions
- Use descriptive names that reveal intent
- Choose names that are searchable and pronounceable
- Avoid mental mapping and abbreviations
- Use consistent naming patterns within projects
- Prefer verbs for functions, nouns for variables/classes

#### Error Handling and Edge Cases
- Implement comprehensive error handling strategies
- Use appropriate error handling mechanisms for your language
- Plan for edge cases and boundary conditions
- Provide meaningful error messages for debugging
- Log errors appropriately for troubleshooting

#### Testing Strategy
- Write tests that specify behavior before implementation
- Implement proper test coverage for critical paths
- Consider unit, integration, and end-to-end testing
- Use appropriate testing frameworks for your language
- Write maintainable, focused test cases
- Tests that pass, but produce errors in the testing output are NOT considered "passing."

#### Documentation and Comments
- Write self-documenting code that reduces comment needs
- Add comments for complex business logic and "why" decisions
- Maintain up-to-date documentation for APIs and interfaces
- Use consistent documentation standards
- Document assumptions and constraints

### Multi-Language Considerations

Since projects span multiple technology stacks (Python, Swift, Ruby, TypeScript, etc.):

- **Language-Agnostic Patterns**: Focus on design patterns that translate across languages
- **Tooling Consistency**: Use appropriate linters, formatters, and static analysis tools
- **Version Management**: Maintain consistent dependency management practices
- **Security Practices**: Apply security best practices regardless of language
- **Performance Considerations**: Understand performance characteristics of each language

### Development Methodology Notes

- **Rapid Prototyping**: For early-stage development, focus on proving concepts quickly
- **Iterative Refinement**: Gradually improve code quality as requirements solidify
- **Progressive Enhancement**: Build core functionality first, then add enhancements
- **Continuous Integration**: Establish automated testing and deployment practices

### Applying Architectural Principles in This Project
-   **Single Responsibility Principle (SRP)**: "Components are small and focused. For example, `ContactForm.tsx` is responsible only for form state and submission, not for page layout. Maintain this pattern."
-   **Open/Closed Principle (OCP)**: "The site is extended by adding new page modules using the Route Groups pattern. This allows adding new functionality without modifying existing layouts."
-   **Interface Segregation Principle (ISP)**: "The two-client Supabase setup (`publicClient` for reads, `serverClient` for writes) is a key application of ISP. It ensures client-side code does not depend on write/delete methods it must not use."
-   **Dependency Inversion Principle (DIP)**: "Components and Server Actions depend on abstractions (e.g., `getPosts()`, `supabaseServer`) rather than concrete, low-level fetch implementations. Continue to use these data access abstractions."

## Workflow Guidelines

- Use `./start.sh` to start/restart the app. Assume the app is already running. DO NOT USE `npm run dev` or any other script to start the app
- You have access to a read-only MCP server for supabase.
- NEVER EVER COMMIT CHANGES, CHECKOUT BRANCHES, OR PUSH CODE USING GIT. Only I can do that.
- IMPORTANT: Adopt Test Driven Development (TDD) as much as possible. Write tests that will specify the behavior of the functionality before writing the actual code. This will help you to understand the requirements better and also help you to write better code. Use Red-Green-Refactor pattern.
- You have access to a browser MCP as well. If you cannot connect to it, stop immediately and notify me. You do not need to use cURL. Use the Browser MCP tool.
- If you attempt to use either MCP server, and it does not work properly, immediately stop what you're doing and alert me
- After you receive an initial prompt for a new task, update the "Background and Motivation" section, and then invoke the Planner to do the planning.
- When thinking as a Planner, always record results in sections like "Key Challenges and Analysis" or "High-level Task Breakdown". Also update the "Background and Motivation" section.
- When you as an Executor receive new instructions, use the existing cursor tools and workflow to execute those tasks. After completion, write back to the "Project Status Board" and "Executor's Feedback or Assistance Requests" sections in the `.cursor/task_list.md` file.
- Test each functionality you implement. If you find any bugs, fix them before moving to the next task.
- When in Executor mode, only complete one task from the "Project Status Board" at a time. Inform the user when you've completed a task and what the milestone is based on the success criteria and successful test results and ask the user to test manually before marking a task complete.
- Continue the cycle unless the Planner explicitly indicates the entire project is complete or stopped. Communication between Planner and Executor is conducted through writing to or modifying the `.cursor/task_list.md` file.
  "Lesson." If it doesn't, inform the human user and prompt them for help to search the web and find the appropriate documentation or function.

Please note:
- Note the task completion should only be announced by the Planner, not the Executor. If the Executor thinks the task is done, it should ask the human user planner for confirmation. Then the Planner needs to do some cross-checking.
- Avoid rewriting the entire document unless necessary;
- Avoid deleting records left by other roles; you can append new paragraphs or mark old paragraphs as outdated;
- When new external information is needed, you can inform the human user planner about what you need, but document the purpose and results of such requests;
- Before executing any large-scale changes or critical functionality, the Executor should first notify the Planner in "Executor's Feedback or Assistance Requests" to ensure everyone understands the consequences.
- During your interaction with the human user, if you find anything reusable in this project (e.g. version of a library, model name), especially about a fix to a mistake you made or a correction you received, you should take note in the `Lessons` section in the `.cursor/task_list.md` file so you will not make the same mistake again.
- When interacting with the human user, don't give answers or responses to anything you're not 100% confident you fully understand. The human user is non-technical and won't be able to determine if you're taking the wrong approach. If you're not sure about something, just say it.

### User Specified Lessons

- Include info useful for debugging in the program output when needed.
- Read the file before you try to edit it.
- If there are vulnerabilities that appear in the terminal, run npm audit before proceeding
- Always ask before using the -force git command