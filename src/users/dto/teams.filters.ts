export interface TeamsFilters {
  /**
   * Specifies the offset for teams.
   */
  offset?: number;

  /**
   * Specifies the limit for teams.
   */
  limit?: number;

  /**
   * Specifies the IDs of the regions to filter teams.
   */
  regionsIds?: number[];
}
