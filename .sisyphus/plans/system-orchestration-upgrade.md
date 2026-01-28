# Plan: System Orchestration & Multi-Agent Integration Upgrade

## Context

### Original Request

让 opencode 默认学会调用所有 agents，整合 Prometheus、Metis、Momus 等编排层 Agent，以及 OMO 定义的特种 Agent。通过 meta-prompt 和专门的 Skill 强制模型进入“编排者”模式。

### Interview Summary

- **核心逻辑**: 整合 `using-superpowers` skill，加入完整的 Agent 列表和 Mandatory Triggers。
- **Agent 构成**: 包含编排层（Prometheus/Metis/Momus/Sisyphus）、核心层（explore/librarian/oracle）以及 OMO 自定义层（max-research/code-review/ui-ux 等）。
- **强制力**: 使用强硬措辞（EXTREMELY-IMPORTANT）和 Red Flags 自检表。

---

## Work Objectives

### Core Objective

升级系统元指令（CLAUDE.md）和核心 Skill（using-superpowers），确立“编排者优先（Orchestrator-First）”的运行标准。

### Concrete Deliverables

- [ ] `~/.claude/CLAUDE.md`: 更新 Meta-prompt，加入 Agent 定义查询路径。
- [ ] `~/.claude/skills/using-superpowers/SKILL.md`: 整合多 Agent 委派逻辑，加入全量 Agent 列表。

### Definition of Done

- [ ] 所有新 Agent（Prometheus, Metis, Momus, max-research 等）都在 Skill 中有明确的触发场景和说明。
- [ ] 规则中明确要求：在不确定时，必须查询 `oh-my-opencode.json` 或 `agents/` 目录。

---

## Task Flow

1. 更新 CLAUDE.md -> 2. 更新 using-superpowers/SKILL.md -> 3. 验证清理

---

## TODOs

- [x] 1. 更新 `~/.claude/CLAUDE.md`
     **内容**: 简化当前强硬措辞，重点加入 Agent 定义的查询路径，确保模型知道"去哪里查新 Agent"。
     **Acceptance**: 文件包含 `## Multi-Agent Delegation (MANDATORY)` 章节且有 `Where to Find Agent Definitions` 列表。

- [x] 2. 整合并更新 `~/.claude/skills/using-superpowers/SKILL.md`
     **内容**:
  - 加入编排层（Prometheus, Metis, Momus, Sisyphus）的详细说明。
  - 加入 OMO 自定义 Agent（max-research, code-review 等）的列表。
  - 更新 Mandatory Triggers 表格。
  - 更新 Red Flags，识别"试图绕过编排"的念头。
    **Acceptance**: 文件包含 `Part 1: Orchestration Layer` 和 `Part 2: Specialized Sub-Agents` 两个核心部分。

- [x] 3. 清理冗余 Skill
     **内容**: 删除之前临时创建的 `/Users/luodian/.claude/skills/mandatory-multi-agent` 目录（如果还存在）。

---

## Success Criteria

### Final Checklist

- [x] 运行 `Skill mandatory-multi-agent` 应该返回已删除（或找不到）。
- [x] 运行 `Skill using-superpowers` 应该显示包含 Prometheus 和 OMO Agent 的完整手册。
- [x] CLAUDE.md 包含所有 Agent 定义文件的参考路径。
