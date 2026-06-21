#!/bin/bash
pnpm dev > /tmp/nextjs.log 2>&1 &
echo $! > /tmp/nextjs.pid
sleep 15
