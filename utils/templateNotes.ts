
import { Note } from '../types';

type NoteTemplate = Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isTemplate' | 'isArchived' | 'graphData' | 'projectId' | 'subjectId'> & {
    project: string,
    subject: string,
    projectDescription?: string;
};

export const PREBUILT_TEMPLATES: NoteTemplate[] = [
    {
        title: "Meeting Minutes Template",
        content: `## Meeting Details

**Date:** {{Today}}
**Time:** 
**Location:** 

## Attendees

- 
- 

## Agenda

1.  Topic 1
2.  Topic 2
3.  Topic 3

## Discussion Points / Notes

### Topic 1:

- 

### Topic 2:

- 

## Action Items

- [ ] (Owner) Task description
- [ ] (Owner) Task description

## Key Decisions Made

- `,
        project: "Templates",
        subject: "Meetings",
        projectDescription: "A collection of pre-built templates to get you started.",
        summary: "A standard template for capturing meeting minutes, including agenda, discussion, and action items.",
        detailedSummary: "",
        todos: [],
        keyPeople: [],
        tags: ["meeting", "minutes", "template"],
        decisions: [],
        attachments: [],
    },
    {
        title: "Workshop Plan Template",
        content: `## Workshop Overview

**Goal:** 
**Duration:** 
**Materials Needed:**

## Participants

- 
- 

## Schedule & Activities

### Introduction & Icebreaker (15 mins)
- 

### Activity 1: (e.g., Brainstorming) (45 mins)
- **Objective:** 
- **Process:** 

### Break (10 mins)

### Activity 2: (e.g., Prioritization) (45 mins)
- **Objective:** 
- **Process:** 

### Wrap-up & Next Steps (15 mins)
- 

## Desired Outcomes

- 
- `,
        project: "Templates",
        subject: "Workshops",
        projectDescription: "A collection of pre-built templates to get you started.",
        summary: "A structured template for planning a workshop, including goals, activities, and outcomes.",
        detailedSummary: "",
        todos: [],
        keyPeople: [],
        tags: ["workshop", "planning", "facilitation", "template"],
        decisions: [],
        attachments: [],
    },
    {
        title: "Decision Log Template",
        content: `## Decision Record

**Status:** (Proposed, Approved, Rejected)
**Date:** {{Today}}

## 1. Decision to be Made
*Briefly describe the situation or question requiring a decision.*


## 2. Context & Background
*Provide relevant background information, data, or links to other documents.*


## 3. Options Considered

### Option A: 
- **Pros:** 
- **Cons:** 

### Option B: 
- **Pros:** 
- **Cons:** 

### Option C: 
- **Pros:** 
- **Cons:** 


## 4. Final Decision & Reasoning
**Decision:** 

**Reasoning:** 


**Approved by:** 
**Impacted Teams/People:** `,
        project: "Templates",
        subject: "Decisions",
        projectDescription: "A collection of pre-built templates to get you started.",
        summary: "A formal template for documenting a key decision, including context, options, and reasoning.",
        detailedSummary: "",
        todos: [],
        keyPeople: [],
        tags: ["decision", "log", "adr", "template"],
        decisions: [],
        attachments: [],
    },
    {
        title: "Daily Scrum Stand-up Template",
        content: `## Daily Stand-up Notes

**Date:** {{Today}}

### Team Members
- 

---

### [Team Member Name]
- **Yesterday:** 
- **Today:** 
- **Blockers:** 

### [Team Member Name]
- **Yesterday:** 
- **Today:** 
- **Blockers:** 

### [Team Member Name]
- **Yesterday:** 
- **Today:** 
- **Blockers:** 

---
### General Notes / Announcements
- `,
        project: "Templates",
        subject: "Scrum",
        projectDescription: "A collection of pre-built templates to get you started.",
        summary: "A simple template to capture daily updates from a Scrum stand-up meeting.",
        detailedSummary: "",
        todos: [],
        keyPeople: [],
        tags: ["scrum", "agile", "standup", "daily", "template"],
        decisions: [],
        attachments: [],
    }
];