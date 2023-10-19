import { RedisClientSelectorType } from "../utils/redis";
import * as redis from "redis";

export const mockGet = jest.fn();
export const mockSet = jest.fn();
export const mockSetEx = jest.fn();
export const mockMget = jest.fn();
export const mockSmembers = jest.fn();
export const mockSismember = jest.fn();
export const mockSrem = jest.fn();
export const mockTtl = jest.fn();
export const mockExists = jest.fn();
export const mockDel = jest.fn();
export const mockSadd = jest.fn();
export const mockQuit = jest.fn().mockResolvedValue(void 0);
export const mockRedisClusterType = {
  set: mockSet,
  setEx: mockSetEx,
  get: mockGet,
  mGet: mockMget,
  del: mockDel,
  sAdd: mockSadd,
  sRem: mockSrem,
  sMembers: mockSmembers,
  sIsMember: mockSismember,
  ttl: mockTtl,
  exists: mockExists,
  quit: mockQuit,
} as unknown as redis.RedisClusterType;
export const mockSelect = jest
  .fn()
  .mockImplementation(() => [mockRedisClusterType, mockRedisClusterType]);
export const mockSelectOne = jest
  .fn()
  .mockImplementation(() => mockRedisClusterType);
export const mockRedisClientSelector = {
  select: mockSelect,
  selectOne: mockSelectOne,
} as unknown as RedisClientSelectorType;
