import OpenAI from "openai";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

async function main() {
  const [, , flag, prompt] = process.argv;  
  const apiKey = process.env.OPENROUTER_API_KEY;
  let conversation = []; 
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  conversation.push({ role: "user", content: prompt });

  let result;
  while(true){
    // now we have to register the content of the prompt in our array 

    const response = await client.chat.completions.create({
      model: "anthropic/claude-haiku-4.5",
      messages: conversation,
      tools : [
        {
          "type": "function",
          "function": {
            "name": "Read",
            "description": "Read and return the contents of a file",
            "parameters": {
              "type": "object",
              "properties": {
                "file_path": {
                  "type": "string",
                  "description": "The path to the file to read"
                }
              },
              "required": ["file_path"]
            }
          }
        },
        {
          "type": "function",
          "function": {
            "name": "Write",
            "description": "Write content to a file",
            "parameters": {
              "type": "object",
              "required": ["file_path", "content"],
              "properties": {
                "file_path": {
                  "type": "string",
                  "description": "The path of the file to write to"
                },
                "content": {
                  "type": "string",
                  "description": "The content to write to the file"
                }
              }
            }
          }
        },
        {
          "type": "function",
          "function": {
            "name": "Bash",
            "description": "Execute a shell command",
            "parameters": {
              "type": "object",
              "required": ["command"],
              "properties": {
                "command": {
                  "type": "string",
                  "description": "The command to execute"
                }
              }
            }
          }
        }
      ],
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }


    // see if it contains a tool_calls
    const choice = response.choices[0];
    if (choice.finish_reason == "tool_calls"){
      // extract what tools 
      const tool_called = choice.message.tool_calls[0];
      const tool_name = tool_called.function.name
      if (tool_name == "Read"){
        // parse the arguments
        const args = JSON.parse(tool_called.function.arguments);
        conversation.push({role : "assistant", content : null, tool_calls : choice.message.tool_calls});
        //execute the tool 
        const data = await fs.promises.readFile(args.file_path,"utf-8");
        conversation.push({role : "tool", tool_call_id : choice.message.tool_calls[0].id, content : data});
        //console.log(data);
      } else if(tool_name == "Write"){
        const args = JSON.parse(tool_called.function.arguments);
        conversation.push({role : "assistant", content : null, tool_calls : choice.message.tool_calls});
        await fs.promises.writeFile(args.file_path, args.content);
        conversation.push({role : "tool", tool_call_id : choice.message.tool_calls[0].id, content : args.content});
      } else if(tool_name == "Bash"){
        const args = JSON.parse(tool_called.function.arguments);
        conversation.push({role : "assistant", content : null, tool_calls : choice.message.tool_calls});
        const execAsync = promisify(exec);
        try {
          const { stdout, stderr } = await execAsync(args.command);
          conversation.push({role : "tool", tool_call_id : choice.message.tool_calls[0].id, content : stdout});
        }catch (error){
          conversation.push({role : "tool", tool_call_id : choice.message.tool_calls[0].id, content : error.stderr});
        }
      }
    }else {
      conversation.push({role: choice.message.role, content : choice.message.content});
      result = choice.message.content
      break;
    }

    // You can use print statements as follows for debugging, they'll be visible when running tests.
    console.error("Logs from your program will appear here!");

  }
  console.log(result);
}

main();
