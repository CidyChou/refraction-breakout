import test from 'node:test';
import assert from 'node:assert/strict';
import { capsuleCircleOverlap, pointSegmentDistanceSq } from '../src/core/collision.js';

test('detects an enemy crossed between two frames',()=>{
  assert.equal(capsuleCircleOverlap(0,0,100,0,50,6,7),true);
});

test('does not hit outside the combined radii',()=>{
  assert.equal(capsuleCircleOverlap(0,0,100,0,50,8,7),false);
});

test('clamps collision checks to both segment endpoints',()=>{
  assert.equal(pointSegmentDistanceSq(-4,3,0,0,10,0),25);
  assert.equal(pointSegmentDistanceSq(14,3,0,0,10,0),25);
});

test('handles a stationary projectile without division errors',()=>{
  assert.equal(capsuleCircleOverlap(4,5,4,5,7,9,5),true);
  assert.equal(capsuleCircleOverlap(4,5,4,5,8,9,5),false);
});
