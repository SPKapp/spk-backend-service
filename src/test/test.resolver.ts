import { Query, Resolver } from '@nestjs/graphql';
import { Author } from './test.model';

@Resolver(() => Author)
export class TestResolver {
  @Query(() => Author)
  async author() {
    return { firstName: 'Tester', lastName: 'Kowalski' };
  }
}
