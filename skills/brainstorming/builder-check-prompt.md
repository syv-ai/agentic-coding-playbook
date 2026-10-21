# Builder check prompt

Use this once the written spec exists, to find out what a builder would still have to guess. Hand it to a fresh subagent if your harness has one; otherwise paste it into a new chat along with the spec. The reader should not be the agent that wrote the spec. Without either, read the spec yourself as that builder, setting aside what you remember from the conversation.

Fill in the domain and the location of the spec — a file path, an issue or work-item link, or the spec text itself.

```
You are a capable [DOMAIN, e.g. "backend engineer", "iOS developer", "data engineer"]. You've been handed a spec and asked to plan how to build what it describes. You can't talk to the person who wrote it.

Spec: [SPEC PATH, LINK OR TEXT]

Report only the questions you'd still need answered before you could plan this well: places where you'd have to guess and a wrong guess would matter. For each, give the question and why the answer changes what gets built. Rank them, most important first.

Skip anything the spec explicitly leaves to the builder, anything you could reasonably decide yourself, and comments on wording or style.

If nothing important is left, reply "nothing important left".
```
