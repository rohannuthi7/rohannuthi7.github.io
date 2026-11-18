---
title: Synapse
tagline: Reads a digit from an 8×8 grid of light cells, with the weighted sums computed on an FPGA.
summary: >-
  A digit classifier built as hardware. Light on 64 analog cells becomes brightness bytes,
  and a SystemVerilog datapath on an FPGA scores all ten digits and picks the winner.
team: "2"
dates: { start: "2026-10", end: ongoing }
status: In progress
repo: https://github.com/rohannuthi7/Synapse
private: false
stack: [SystemVerilog, DE1-SoC, FastAPI, TypeScript]
cover: { src: ./web-app.webp, alt: "The Synapse web app turning a handwritten digit into an 8×8 grid of brightness values" }
stats:
  - { label: Input, value: "8×8 light cells" }
  - { label: Weights, value: "640 signed bytes", accent: true }
  - { label: Link, value: "UART, 115200 baud" }
frames:
  - { src: ./web-app.webp, alt: "The Synapse web app turning a handwritten digit into an 8×8 grid of brightness values, with each preprocessing stage listed" }
  - { src: ./datapath.webp, alt: "The 8×8 datapath: a register file of brightnesses, ten weight maps feeding multipliers, and an adder tree that reduces them to one score per digit" }
  - { src: ./bridge.webp, alt: "Software to hardware bridge: Python and FastAPI over USB to a UART adapter, wired to a SystemVerilog design on the FPGA board" }
collage:
  - { src: ./web-app.webp, alt: "The web app that preprocesses a handwritten digit into 64 brightness values" }
  - { src: ./sample-digit.webp, alt: "A handwritten 7, the kind of input the grid is meant to read" }
  - { src: ./bridge.webp, alt: "USB to UART bridge between the Python server and the FPGA board" }
  - { src: ./datapath.webp, alt: "The full 8×8 datapath from register file through multipliers and the adder tree" }
order: 3
draft: false
---

## Overview

Synapse identifies a digit from 0 through 9 on an 8×8 grid of light cells. Each cell is an unsigned brightness from 0 through 255, and each digit owns a signed weight for every cell. The digit with the largest sum of brightness times weight is the prediction. The repo builds and tests neuromorphic-inspired and Von Neumann-inspired versions of the network to compare them, and the Von Neumann path is documented end to end.

In short: light on a cell becomes one brightness byte, the bytes become ten weighted sums, and the largest sum is the winning digit.

A web app preprocesses a handwritten digit down to 64 values: it validates, orients, grayscales, crops and centers, downsamples, and stretches the contrast so the darkest cell is 0 and the brightest 255.

## Technical details

**The datapath.** Software owns the frame and the weights. A register file holds 64 unsigned bytes, one per cell, and memory holds 10 × 64 = 640 weights. `score.sv` multiplies `x[i] * w[i]` for one digit, and the 64 products fold down a six-level adder tree of 32, 16, 8, 4, 2 and 1 adders. One product fits in signed 16 bits, but sixty-four of them can reach −2,088,960, so the accumulator is a signed 22-bit sum. Ten passes give ten scores, and the largest is the prediction. A tie is reported as a tie.

**The bridge.** The browser posts the picture to a Python FastAPI server, which opens the serial port. One USB cable runs to a 3.3 V USB-UART adapter, and three jumpers (TX, RX and ground) connect it to the DE1-SoC's GPIO. The line is 115200 baud, 8 data bits, no parity and 1 stop bit, so one bit is 434 cycles of the 50 MHz clock. `uart_rx.sv`, `score.sv` and `uart_tx.sv` meet the pins in `synapse_top.sv`. Each 22-bit score is sign-extended to 32 bits and sent back as four bytes.

**The cell.** Each cell is a small analog circuit. A light-dependent resistor and a bias resistor form a divider, so light raises the voltage on a capacitor that holds it. A reset switch clears the cell before each frame, and a comparator with a little feedback keeps the output bit from chattering on the threshold.

## Design decisions

**Brightness bytes, not one bit per cell.** The comparator gives a lit-or-dark bit, but the score uses the full 0 through 255 brightness. A weight chosen for a lit-or-dark cell would get multiplied by as much as 255, so the weights have to be trained on real brightnesses.

**Signed weights.** A bright cell can vote against a digit. A cell that is bright only for an 8 carries a large positive weight on 8 and a small or negative weight on the digits that are dark there.

**Load the weights once.** The ten weight packets cost about 60 ms on the wire, but they are sent once and kept. Every later picture is a single 68-byte frame, about 5.9 ms.

**Three wires.** The link is TX, RX and a shared ground. The 50 MHz clock is already on the board, and the USB-Blaster is a second cable that only loads the bitstream.

## Future upgrades

- **Tolerate sloppier input.** The grid is reliable when one digit fills it, stays centered and is much brighter than an empty cell. It classifies the pattern already on the cells and does not search a page for a digit. A shift of one cell, a very different stroke width, or ambient light raising the empty cells can all swap the winner.
- **Better-separated weights.** An 8 and a 0 differ by only a few middle cells, so one cell far from the examples can swap the winner. Training on a wider range of brightness examples is the place to start.
