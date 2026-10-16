---
title: PickleIQ
tagline: Coaching video analysis that turns match footage into per-player feedback on swing mechanics and court positioning.
summary: >-
  Computer-vision coaching tool that extracts player position, body angles and swing
  metrics from match video and turns them into form feedback a coach can act on.
role: Lead engineer
team: "[number]"
dates: { start: "2026-06", end: ongoing }
status: In use
repo: https://github.com/rohannuthi7
private: false
stack: [Python, PyTorch, React, FastAPI]
cover: { src: ./cover-app.png, alt: "PickleIQ court view with four tracked players, their pose skeletons and the ball trajectory" }
collage:
  - { src: ./01.svg, alt: "[Court-side capture rig at the facility]" }
  - { src: ./02.svg, alt: "[Ball-tracking overlay, square frame]" }
  - { src: ./03.svg, alt: "[Player pose and swing angles]" }
  - { src: ./04.svg, alt: "[Coach feedback view, 4:3 crop]" }
order: 1
draft: false
---

## Overview

Built and field-tested with a commercial indoor pickleball facility, PickleIQ tracks athletes and the ball in match video and produces biomechanical feedback a coach can act on. It is in use for 200+ members of the club.

## Technical details

Ball detection fine-tunes TrackNetV2 on about 600 hand-labeled frames, raising detection coverage from 0.5% to 34% of frames. Rally boundaries are sharpened by fitting ballistic trajectories and Kalman-filtering the noisy per-frame detections. Rally segmentation runs as a two-pass filter: likely rallies are flagged on downsampled frames first, and full-resolution player and ball tracking runs only on the candidates that survive, cutting end-to-end segmentation time by 85%.

The system is split between a local frontend container and an EC2 GPU worker that never talk to each other directly; uploads and results move only through shared S3 storage, and a Lambda function starts GPU processing on each new upload.

## Design decisions

[The hardest trade-off: for example, why the frontend and GPU worker are isolated through S3 rather than a direct API, what the alternatives were, and what it cost.]

[Why a coarse-to-fine pass instead of tracking every frame, and the failure mode it introduces.]

## Future upgrades

[Two or three concrete next steps and what each would change for the coach or the player.]
