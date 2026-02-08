<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude_AI-Haiku_4.5-D97757?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenRouter-API-6366F1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

# Building My Own Claude Code CLI

> **An AI agent that can read files, write files, and execute shell commands — built from scratch in ~140 lines of JavaScript.**

I built my own version of [Claude Code](https://docs.anthropic.com/en/docs/claude-code) to understand how agentic AI systems work under the hood. This CLI tool gives Claude the ability to interact with your filesystem and terminal, turning a simple prompt into an autonomous coding assistant.

---

## Demo

```bash
$ node app/main.js -p "Create a python file that prints the first 10 fibonacci numbers"
```

Claude will autonomously:
1. Decide it needs to **write** a file
2. Call the `Write` tool with the generated code
3. Optionally **execute** it with the `Bash` tool to verify it works
4. Return a summary of what it did

---

## How It Works

This project implements the **agentic tool-use loop** — the same core pattern behind Claude Code, ChatGPT Code Interpreter, and other AI coding agents.

### The Architecture

```
┌─────────────────────────────────────────────────────┐
│                    USER PROMPT                       │
│            "Create a hello.txt file"                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   AGENT LOOP   │◄──────────────────┐
              └───────┬────────┘                    │
                      │                             │
                      ▼                             │
        ┌─────────────────────────┐                 │
        │   Claude API (Haiku 4.5)│                 │
        │   via OpenRouter        │                 │
        └────────────┬────────────┘                 │
                     │                              │
              ┌──────┴──────┐                       │
              │             │                       │
         Tool Call?    No Tool Call                  │
              │             │                       │
              ▼             ▼                       │
     ┌────────────┐   ┌──────────┐                  │
     │  Execute   │   │  Print   │                  │
     │  Tool      │   │  Result  │                  │
     │            │   │  & Exit  │                  │
     │ - Read     │   └──────────┘                  │
     │ - Write    │                                 │
     │ - Bash     │                                 │
     └─────┬──────┘                                 │
           │                                        │
           │   Add tool result to conversation      │
           └────────────────────────────────────────┘
```

### The Core Concept: Tool-Use Loop

The magic of agentic AI is a deceptively simple loop:

1. **Send** the user's prompt + conversation history to Claude
2. **Check** if Claude wants to use a tool (finish_reason: `"tool_calls"`)
3. **If yes** — execute the tool locally, append the result to the conversation, and go back to step 1
4. **If no** — Claude is done; print the final response and exit

This loop allows Claude to chain multiple actions together. For example, to fix a bug, Claude might:
- **Read** the file to understand the code
- **Write** the fix
- **Bash** `node file.js` to test it
- **Read** the output and confirm it works

All from a single prompt.

### The Three Tools

| Tool | What it does | How it's implemented |
|------|-------------|---------------------|
| **Read** | Reads a file and returns its contents | `fs.promises.readFile()` |
| **Write** | Creates or overwrites a file with given content | `fs.promises.writeFile()` |
| **Bash** | Executes any shell command and returns stdout/stderr | `child_process.exec()` |

Each tool is defined as a JSON schema and passed to the API. Claude decides **when** and **how** to use them based on the prompt — no hardcoded logic needed.

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- An **OpenRouter API key** ([get one here](https://openrouter.ai/keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/haythamzaaboul/Building-my-own-Claude-Code-CLI.git
cd Building-my-own-Claude-Code-CLI

# Install dependencies
npm install
```

### Configuration

Set your OpenRouter API key as an environment variable:

```bash
export OPENROUTER_API_KEY="sk-or-v1-your-key-here"
```

Or create a `.env` file (it's already in `.gitignore`):

```bash
echo 'OPENROUTER_API_KEY=sk-or-v1-your-key-here' > .env
```

> **Note:** If using a `.env` file, you'll need to source it before running: `source .env` or use a tool like `dotenv`.

### Usage

```bash
node app/main.js -p "your prompt here"
```

### Examples

```bash
# Create a file
node app/main.js -p "Create a file called hello.py that prints Hello World"

# Read and explain code
node app/main.js -p "Read main.js and explain what it does"

# Run a command
node app/main.js -p "List all JavaScript files in this directory"

# Multi-step task
node app/main.js -p "Create a Node.js HTTP server in server.js, then run it and curl localhost to verify it works"
```

---

## Project Structure

```
.
├── app/
│   └── main.js          # The entire agent — ~140 lines
├── package.json         # Dependencies & metadata
├── .gitignore           # Ignores node_modules and .env
└── README.md            # You are here
```

Yes, the whole thing is a **single file**. That's the point — to show that the agentic pattern is elegant in its simplicity.

---

## What I Learned

Building this project taught me the fundamental pattern behind every AI coding agent:

- **Tool-use / Function calling** — How LLMs communicate intent to execute actions, and how the host program fulfills those actions in a loop
- **Multi-turn conversation management** — Maintaining context across multiple API calls by tracking messages, tool calls, and tool results
- **The agent loop** — The core `while(true)` loop that keeps running until the model decides it's done — the model is in control, not the code
- **JSON Schema for tool definitions** — How to describe capabilities to an LLM so it knows what's available and how to call each tool

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime |
| **OpenAI SDK** | API client (compatible with OpenRouter) |
| **OpenRouter** | LLM gateway to access Claude |
| **Claude Haiku 4.5** | The AI model powering the agent |

---

## Author

**Haytham ZAABOUL** — Software Engineering Student at [ENSEEIHT](https://www.enseeiht.fr/) (INP Toulouse)

- GitHub: [@haythamzaaboul](https://github.com/haythamzaaboul)
- Email: zaaboulhaytham@gmail.com

---

## License

MIT — do whatever you want with it.

---

<p align="center">
  <b>If you found this interesting, drop a star!</b>
</p>
