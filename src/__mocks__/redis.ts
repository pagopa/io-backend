import { RedisClientSelectorType } from "../utils/redis";

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
export const mockSelectOne = jest.fn().mockImplementation(() => ({
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
}));
export const mockRedisClientSelector = {
  selectOne: mockSelectOne,
} as unknown as RedisClientSelectorType;
