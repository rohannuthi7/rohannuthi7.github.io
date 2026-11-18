---
title: surg+f
tagline: Search surgical videos. Ask when something happens in an operation and jump straight to that moment.
summary: >-
  A search engine for surgery video. A model labels every second of an operation,
  so you can ask in plain words and land on the exact clip. A MadHacks 2026 Databricks winner.
team: "4"
dates: { start: "2026-11", end: "2026-11" }
status: Shipped
repo: https://github.com/rohannuthi7/surg-f
private: false
demo: https://surg-f-7474644357435752.aws.databricksapps.com/presentation-demo
stack: [Databricks, FastAPI, PyTorch, three.js]
cover: { src: ./home.webp, alt: "The surg+f homepage with a search box reading 'When is the cystic duct cut?'" }
stats:
  - { label: Award, value: "Databricks winner, MadHacks 2026", accent: true }
  - { label: Labels per second, value: "29" }
  - { label: Surgeries indexed, value: "50" }
frames:
  - { src: ./home.webp, alt: "The surg+f homepage with a search box reading 'When is the cystic duct cut?'" }
  - { src: ./solution.webp, alt: "A search for 'when is the cystic duct cut' mapped to the scissors label, returning VID01 from 14:20 to 14:37" }
  - { src: ./model-3d.webp, alt: "A 3D model of the gallbladder area at the clipping step" }
collage:
  - { src: ./home.webp, alt: "The surg+f homepage" }
  - { src: ./solution-card.webp, alt: "The question 'when is the cystic duct cut' becomes a search for scissors and returns the clip at 14:20" }
  - { src: ./model-3d.webp, alt: "The 3D model of the gallbladder area at the clipping step" }
  - { src: ./stack-layers.webp, alt: "The six layers of the stack, from the player down to the surgery video" }
order: 2
draft: false
---

## Overview

surg+f labels every second of surgical video so you can search it in plain words. Ask "When is the cystic duct cut?" and the player jumps straight to the clip. It was built at MadHacks 2026 by Aadhitya Balaji, Shlok Jadhav, Mihir Kaushal and me, and it was one of the event's Databricks winners.

Surgery videos are long and hard to search. One gallbladder removal in the CholecT50 dataset runs 28 minutes 53 seconds, and the cystic duct being cut is a 17-second stretch starting at 14:20. Finding it means scrubbing back and forth. Residents want to watch a step before doing it, surgeons want to review one before an operation, educators want to cut the key seconds into a lesson, and researchers want to compare one step across many operations.

surg+f is a study tool, not a medical device. The model's predictions are approximate, and the 3D model and quiz have not been reviewed by a doctor yet.

## Technical details

A model predicts 29 labels for every second: tools, actions and anatomy. Frame features come from SurgVLP, a model already trained on surgical video, which turns each second into 768 numbers. A small scikit-learn neural network predicts all 29 labels at once from five seconds of video. It trained on 42 surgeries, was tuned on 3 and tested on 4 it never saw, with every run logged in MLflow.

On those 4 test surgeries the common labels work well: grasper scores 0.89 F1, retract 0.86 and gallbladder 0.88. Rare labels are not reliable yet, and the average over all 29 is 0.34. Training on 42 surgeries instead of 12 raised scissors from 0.07 to 0.29. A second model, Faster R-CNN trained further on Endoscapes, draws experimental bounding boxes. It finds the gallbladder well (0.93) but often misses the small cystic duct (0.39 recall).

The data side runs on Databricks. Features, labels and models live in Unity Catalog Volumes, serverless Lakeflow Jobs run extraction, training and export, and one Delta table holds every labeled or predicted clip. The app is a Vite player with three.js for the 3D anatomy, served by a FastAPI backend on Databricks Apps. Clip search runs on Databricks SQL, free-form questions go to Genie, and Llama 3.3 70B decides how to handle each chat message.

## Design decisions

**Search over labels, not over video.** "Cut" maps to the scissors label, and the search becomes a plain SQL query over the clip table. That keeps results exact, and it means surgeon-written labels and model predictions answer the same question, with each result marked as one or the other.

**An import job that is safe to rerun.** A Lakeflow job loads new clips with a MERGE, so running it again adds no duplicates.

**Honest evaluation.** Scores are reported on surgeries the model never saw, and the rare labels that do not work yet are stated rather than averaged away. The bounding boxes are labelled experimental.

## Future upgrades

- **Rare labels.** Scissors, omentum and the cystic duct are the weakest. Training on 42 surgeries instead of 12 already raised scissors from 0.07 to 0.29.
- **Clinical review.** The 3D model and quiz have not been checked by a doctor.
- **Licensing.** CholecT50, Cholec80 and Endoscapes are for non-commercial use only, so the datasets limit where this can go beyond a study tool.
