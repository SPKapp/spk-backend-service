import { Role } from '../roles.eum';
import { UserDetails } from './current-user';

describe('UserDetails', () => {
  describe('constructor', () => {
    it('should throw an error if the role is RegionManager and managerRegions is not set', () => {
      expect(() => new UserDetails({ roles: [Role.RegionManager] })).toThrow(
        'RegionManager role requires managerRegions',
      );
    });

    it('should throw an error if the role is RegionObserver and observerRegions is not set', () => {
      expect(() => new UserDetails({ roles: [Role.RegionObserver] })).toThrow(
        'RegionObserver role requires observerRegions',
      );
    });

    it('should throw an error if the role is Volunteer and teamId is not set', () => {
      expect(() => new UserDetails({ roles: [Role.Volunteer] })).toThrow(
        'Volunteer role requires teamId',
      );
    });
  });

  describe('checkRole', () => {
    it('should return true if the user has the specified role', () => {
      const userDetails = new UserDetails({
        roles: [Role.Admin],
      });
      expect(userDetails.checkRole(Role.Admin)).toBe(true);
    });

    it('should return true if the user has at least one of the specified roles', () => {
      const userDetails = new UserDetails({
        roles: [Role.Admin],
      });
      expect(userDetails.checkRole([Role.RegionManager, Role.Admin])).toBe(
        true,
      );
    });

    it('should return false if the user does not have the specified role', () => {
      const userDetails = new UserDetails({ roles: [] });
      expect(userDetails.checkRole(Role.RegionManager)).toBe(false);
    });
  });

  describe('regions', () => {
    it('should return an empty array if the user does not have any regions', () => {
      const userDetails = new UserDetails({ roles: [] });
      expect(userDetails.regions).toEqual([]);
    });

    it('should return an array of regions if the user has regions', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionManager, Role.RegionObserver],
        managerRegions: [1],
        observerRegions: [2],
      });
      expect(userDetails.regions).toEqual([1, 2]);
    });
  });

  describe('checkRegion', () => {
    it('should return true if the user has access to all of the specified regions', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionManager, Role.RegionObserver],
        managerRegions: [1],
        observerRegions: [2],
      });
      expect(userDetails.checkRegion([1, 2])).toBe(true);
    });

    it('should return false if the user does not have access to all of the specified regions', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionManager, Role.RegionObserver],
        managerRegions: [1],
        observerRegions: [2],
      });
      expect(userDetails.checkRegion([1, 3])).toBe(false);
    });
  });

  describe('checkRegionManager', () => {
    it('should return true if the user has RegionManager role with access to all of the specified regions', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionManager],
        managerRegions: [1],
      });
      expect(userDetails.checkRegionManager([1])).toBe(true);
    });

    it('should return false if the user does not have RegionManager role', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionObserver],
        observerRegions: [1],
      });
      expect(userDetails.checkRegionManager([1])).toBe(false);
    });

    it('should return false if the user does not have access to all of the specified regions', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionManager],
        managerRegions: [1],
      });
      expect(userDetails.checkRegionManager([1, 2])).toBe(false);
    });
  });

  describe('checkRegionObserver', () => {
    it('should return true if the user has RegionObserver role with access to all of the specified regions', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionObserver],
        observerRegions: [1],
      });
      expect(userDetails.checkRegionObserver([1])).toBe(true);
    });

    it('should return false if the user does not have RegionObserver role', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionManager],
        managerRegions: [1],
      });
      expect(userDetails.checkRegionObserver([1])).toBe(false);
    });

    it('should return false if the user does not have access to all of the specified regions', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionObserver],
        observerRegions: [1],
      });
      expect(userDetails.checkRegionObserver([1, 2])).toBe(false);
    });
  });

  describe('checkVolunteer', () => {
    it('should return true if the user has Volunteer role with access to the specified team', () => {
      const userDetails = new UserDetails({
        roles: [Role.Volunteer],
        teamId: 1,
      });
      expect(userDetails.checkVolunteer(1)).toBe(true);
    });

    it('should return false if the user does not have Volunteer role', () => {
      const userDetails = new UserDetails({
        roles: [Role.RegionManager],
        managerRegions: [1],
      });
      expect(userDetails.checkVolunteer(1)).toBe(false);
    });

    it('should return false if the user does not have access to the specified team', () => {
      const userDetails = new UserDetails({
        roles: [Role.Volunteer],
        teamId: 1,
      });
      expect(userDetails.checkVolunteer(2)).toBe(false);
    });
  });
});
