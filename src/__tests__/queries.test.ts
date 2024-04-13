import { describe, it, expect, vi, beforeEach } from 'vitest';
import { currentUser } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { getAuthUserDetails } from '@/lib/queries';

vi.mock('@clerk/nextjs', () => ({
  currentUser: vi.fn()
}));

vi.mock('@/lib/db', () => ({
    db: {
      user: {
        findUnique: vi.fn()
      }
    }
  }));

describe('getAuthUserDetails', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns user data if the user is authenticated and data is found', async () => {
    const mockUser = {
      id: '123',
      emailAddresses: [{ emailAddress: 'test@example.com' }]
    };
    const mockUserData = {
      id: '123',
      email: 'test@example.com',
      Permissions: {}
    };

    vi.mocked(currentUser).mockResolvedValue(mockUser);
    vi.mocked(db.user.findUnique).mockResolvedValue(mockUserData);

    const result = await getAuthUserDetails();

    expect(result).toEqual(mockUserData);
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: mockUser.emailAddresses[0].emailAddress },
      include: expect.any(Object)
    });
  });

  it('returns undefined if the user is authenticated but no data is found', async () => {
    const mockUser = {
      id: '123',
      emailAddresses: [{ emailAddress: 'test@example.com' }]
    };

    vi.mocked(currentUser).mockResolvedValue(mockUser);
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const result = await getAuthUserDetails();
    console.log(result);

    expect(result).toBeNull();
  });

  it('returns undefined if the user is not authenticated', async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    const result = await getAuthUserDetails();

    expect(result).toBeUndefined();
  });
});
