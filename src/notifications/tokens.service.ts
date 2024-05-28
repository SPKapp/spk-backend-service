import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { NotificationConfig } from '../config';

import { FcmToken } from './entities';
import { User } from '../users/entities';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(
    @Inject(NotificationConfig.KEY)
    private readonly config: ConfigType<typeof NotificationConfig>,
    @InjectRepository(FcmToken)
    private readonly tokenRepository: Repository<FcmToken>,
  ) {}

  /**
   * Get all tokens for a user
   * @param userId The user ID
   * @returns An array of tokens
   */
  async getTokens(userId: number): Promise<string[]> {
    const tokens = await this.tokenRepository.find({
      select: ['token'],
      loadEagerRelations: false,
      where: { user: { id: userId } },
    });

    return tokens.map((token) => token.token);
  }

  /**
   * Get all tokens for multiple users
   * @param userIds The user IDs
   * @returns An array of tokens
   */
  async getTokensForUsers(userIds: number[]): Promise<string[]> {
    const tokens = await this.tokenRepository.find({
      select: ['token'],
      loadEagerRelations: false,
      where: { user: { id: In(userIds) } },
    });

    return tokens.map((token) => token.token);
  }

  /**
   * Save a new token or update an existing one
   * @param userId The user ID
   * @param token The FCM token
   */
  async update(userId: number, token: string): Promise<void> {
    let existingToken = await this.tokenRepository.findOneBy({ token });

    existingToken ??= new FcmToken({ user: new User({ id: userId }), token });
    existingToken.updatedAt = new Date();

    await this.tokenRepository.save(existingToken);
  }

  /**
   * Delete a token from the database
   * @param token The token to delete
   */
  async delete(userId: number, token: string): Promise<void> {
    await this.tokenRepository.delete({ user: { id: userId }, token });
  }

  /**
   * Remove tokens that haven't been updated in a while
   * @cron Every day at 1am
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async removeOldTokens(): Promise<void> {
    const cutOffDate = new Date();
    cutOffDate.setDate(cutOffDate.getDate() - this.config.cutOffDays);

    const deleted = await this.tokenRepository.delete({
      updatedAt: LessThan(cutOffDate),
    });

    this.logger.log(`Deleted ${deleted.affected} old tokens`);
  }
}
