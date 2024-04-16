import { VisitType } from '../entities';

/**
 * Represents filters for rabbit notes.
 */
export interface RabbitNotesFilters {
  /**
   * Specifies the offset for paginating notes.
   */
  offset?: number;

  /**
   * Specifies the limit for paginating notes.
   */
  limit?: number;

  /**
   * Specifies filters for vet visits.
   * If true or VisitFilters then returns only notes with vet visits.
   * If false then returns only notes without vet visits.
   * If undefined then returns all notes.
   */
  vetVisit?:
    | {
        /**
         * Specifies list of visit types for filtering visits.
         */
        visitTypes?: VisitType[];

        /**
         * Specifies the starting date for filtering visits.
         */
        dateFrom?: Date;

        /**
         * Specifies the ending date for filtering visits.
         */
        dateTo?: Date;
      }
    | boolean;

  /**
   * Specifies the starting date for filtering notes based on creation date.
   */
  createdAtFrom?: Date;

  /**
   * Specifies the ending date for filtering notes based on creation date.
   */
  createdAtTo?: Date;

  /**
   * Specifies whether to return notes with weight. If false or undefined returns all notes.
   */
  withWeight?: boolean;

  /**
   * Specifies the IDs of the users who created the notes.
   */
  createdBy?: number[];
}
