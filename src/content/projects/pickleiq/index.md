---
title: PickleIQ
tagline: Turns fixed-camera pickleball match video into segmented rallies and per-player coaching feedback.
summary: >-
  Computer-vision coaching tool that finds the rallies in match video, tracks every player
  and the ball, and turns what it sees into timestamped tips a player can act on.
role: Lead engineer
team: "2"
dates: { start: "2026-06", end: ongoing }
status: In use
repo: https://github.com/rohannuthi7/PickleIQ
private: false
stack: [Python, PyTorch, React, FastAPI]
cover: { src: ./court-overlay.webp, alt: "PickleIQ court overlay with four tracked player skeletons and the ball's trail" }
stats:
  - { label: Ball detection, value: "0.5% → 34%" }
  - { label: Improvement, value: "68×", accent: true }
  - { label: Rally segmentation, value: "85% faster" }
frames:
  - { src: ./results.webp, alt: "PickleIQ results screen: per-player takeaways on the left, the match video and timestamped tips on the right" }
  - { src: ./court-overlay.webp, alt: "Pass 2 overlay on a calibrated court: four tracked skeletons labelled P1 to P4 and the ball's trail with its reconstructed height" }
  - { src: ./club-visit.webp, alt: "Three people at Dill Dinkers Pickleball in Madison, WI, with PickleIQ open on a laptop; Rohan Nuthi is on the right" }
collage:
  - { src: ./results-video.webp, alt: "Match video with timestamped tip buttons that jump to each player's moments" }
  - { src: ./results-takeaways.webp, alt: "Per-player key takeaways written from the pipeline's own measurements" }
  - { src: ./court-overlay.webp, alt: "Court model, four tracked player skeletons and the ball's trail with its reconstructed height" }
  - { src: ./club-visit.webp, alt: "Three people at Dill Dinkers Pickleball in Madison, WI, with PickleIQ open on a laptop; Rohan Nuthi is on the right" }
order: 1
draft: false
---

## Overview

PickleIQ turns fixed-camera pickleball match video into segmented rallies and per-player coaching feedback, for recreational players and the clubs that film their courts. It is used by a pickleball club with more than 200 members, and I built it with Aadhitya Balaji.

A player uploads a match. The app finds the rallies, tracks all four players and the ball through them, and returns takeaways for each player along with tips that jump to the exact moment in the video.

- **68x more ball detection.** After fine-tuning TrackNetV2 on about 600 hand-labeled frames, the ball was found in 34% of frames (2,525 of 7,413 on a test clip), up from about 0.5% with the classical motion detector.
- **85% faster rally segmentation** from a two-pass design that only runs the expensive models where a rally is likely.
- **Far-side player recall from 35% to 100%** by running pose estimation at 1920 px instead of 1280 px, at 74 ms per frame instead of 43.

## Technical details

The browser sends the video to a lightweight FastAPI container that only uploads, displays and syncs results. It stores the file in S3. An S3 event starts an EC2 GPU instance through a Lambda function and queues the job in SQS, and the worker long-polls that queue. A periodic bucket scan catches any notification that gets lost.

**Pass 1** scans the whole clip at low resolution, every third frame. A rally is live while a fast, ball-sized blob keeps crossing the net, projected through a court homography. Windows are padded and merged to favour recall. The user keeps or skips each candidate and can mark rallies Pass 1 missed.

**Pass 2** runs at full frame rate, only inside the selected windows. YOLO11-pose with ByteTrack tracks the players, and a colour and court-position re-identification layer keeps player numbers stable across the match. The ball pipeline combines fine-tuned TrackNetV2, a motion-based trajectory selector, RANSAC arc fitting, Kalman smoothing and 3D height reconstruction.

**Coaching** starts from wrist-speed peaks that mark contacts. Form and positioning metrics are scored per frame against thresholds, the most salient moments are selected, and one Claude API call turns them, with a keyframe image for each, into timestamped tips and per-player feedback.

## Design decisions

**Two passes instead of tracking every frame.** Pass 1 is cheap and tuned for recall, so the expensive tracking only runs on the windows that survive. The cost is that Pass 1 can miss a rally entirely, which is why the review step lets a user mark rallies it skipped and sends those back to the worker.

**The UI container never runs computer vision.** It runs with processing switched off and talks to the GPU worker only through S3 and SQS. Uploads and results never need a direct connection between the two, and the worker stops itself when idle, with grace periods so the review step does not force a cold start.

**The model never supplies facts.** Timestamps and player attribution always come from the pipeline's own data. The Claude call only writes the wording around moments the pipeline already measured.

**The original video is never re-encoded.** The results screen plays the uploaded file with dead time skipped and tips linked to their timestamps.

## Future upgrades

- **Ball tracking is the accuracy ceiling.** The far-baseline ball is only a few pixels wide, so its reconstructed height is unreliable there, and contact detection uses pose alone for that reason.
- **Paddle tracking.** Paddle position and face angle are not measured, so much of what a coach watches in a stroke is invisible to the system.
- **Whole-swing form.** Form is judged at single frames such as knee bend and elbow extension. Preparation, sequencing and follow-through are not measured yet.
- **Multi-user separation.** The app is single tenant today, with a placeholder user id in the S3 keys and no authentication.
