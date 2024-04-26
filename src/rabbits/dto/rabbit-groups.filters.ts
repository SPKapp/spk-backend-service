/**
 * Represents the filters for rabbit groups.
 */
export interface RabbitGroupsFilters {
  /**
   * Specifies the offset for rabbit groups.
   */
  offset?: number;

  /**
   * Specifies the limit for rabbit groups.
   */
  limit?: number;

  /**
   * Specifies the IDs of the regions to filter rabbit groups.
   */
  regionsIds?: number[];

  /**
   * Specifies the IDs of the teams to filter rabbit groups.
   */
  teamIds?: number[];

  /**
   * Specifies the name of the rabbit group to filter.
   */
  name?: string;
}
