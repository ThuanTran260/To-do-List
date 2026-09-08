import { describe, it, expect } from 'vitest';
import { getTaskThumbnail, getTaskImages, getTaskStoragePathsForDeletion } from '@/lib/taskImages';
import type { TodoItemData } from '@/types/todo';

describe('taskImages domain helpers', () => {
  describe('getTaskThumbnail', () => {
    it('returns image_thumb_path when present (highest priority)', () => {
      const task: Partial<TodoItemData> = {
        image_thumb_path: 'user/thumb.webp',
        image_path: 'user/full.webp',
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskThumbnail(task)).toBe('user/thumb.webp');
    });

    it('falls back to image_path when image_thumb_path is null', () => {
      const task: Partial<TodoItemData> = {
        image_thumb_path: null,
        image_path: 'user/full.webp',
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskThumbnail(task)).toBe('user/full.webp');
    });

    it('falls back to image_url when both paths are null', () => {
      const task: Partial<TodoItemData> = {
        image_thumb_path: null,
        image_path: null,
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskThumbnail(task)).toBe('https://example.com/legacy.webp');
    });

    it('returns null when task has no images or is null/undefined', () => {
      expect(getTaskThumbnail(null)).toBeNull();
      expect(getTaskThumbnail(undefined)).toBeNull();
      expect(getTaskThumbnail({})).toBeNull();
      expect(getTaskThumbnail({ image_thumb_path: null, image_path: null, image_url: null })).toBeNull();
    });
  });

  describe('getTaskImages', () => {
    it('returns array containing full image_path', () => {
      const task: Partial<TodoItemData> = {
        image_path: 'user/full.webp',
        image_thumb_path: 'user/thumb.webp',
      };
      expect(getTaskImages(task)).toEqual(['user/full.webp']);
    });

    it('falls back to legacy image_url when image_path is missing', () => {
      const task: Partial<TodoItemData> = {
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskImages(task)).toEqual(['https://example.com/legacy.webp']);
    });

    it('returns empty array when task has no full image or is null/undefined', () => {
      expect(getTaskImages(null)).toEqual([]);
      expect(getTaskImages(undefined)).toEqual([]);
      expect(getTaskImages({})).toEqual([]);
    });
  });

  describe('getTaskStoragePathsForDeletion', () => {
    it('returns [image_path, image_thumb_path, image_url] in order', () => {
      const task: Partial<TodoItemData> = {
        image_path: 'user/full.webp',
        image_thumb_path: 'user/thumb.webp',
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskStoragePathsForDeletion(task)).toEqual([
        'user/full.webp',
        'user/thumb.webp',
        'https://example.com/legacy.webp',
      ]);
    });

    it('returns empty array for null/undefined task', () => {
      expect(getTaskStoragePathsForDeletion(null)).toEqual([]);
      expect(getTaskStoragePathsForDeletion(undefined)).toEqual([]);
    });
  });
});
