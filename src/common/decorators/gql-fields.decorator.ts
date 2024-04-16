import { PipeTransform } from '@nestjs/common';
import { Info } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { FieldsByTypeName, parseResolveInfo } from 'graphql-parse-resolve-info';

class GetGqlFieldsPipe implements PipeTransform {
  constructor(resultType?: string) {
    this.resultType = resultType;
  }

  resultType?: string;

  async transform(info: GraphQLResolveInfo): Promise<any> {
    const result = parseResolveInfo(info);

    if (!this.resultType) {
      return result;
    }

    return result.fieldsByTypeName[this.resultType];
  }
}

export const GqlFields = (data?: string) => Info(new GetGqlFieldsPipe(data));

export type GqlFieldsName = FieldsByTypeName;
