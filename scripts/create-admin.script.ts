import { INestApplicationContext } from '@nestjs/common';
import { validate } from 'class-validator';

import { RegionsService } from '../src/common/modules/regions';
import { PermissionsService } from '../src/users';
import { UsersService } from '../src/users/users/users.service';
import { Role } from '../src/common/modules/auth';
import { CreateUserInput } from '../src/users/dto';
import { instanceToInstance } from 'class-transformer';

function askQuestion(query: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans: string) => {
      rl.close();
      resolve(ans);
    }),
  );
}

export default async function (app: INestApplicationContext) {
  console.log('Welcome to the admin user creation script!');
  console.log('-------------------------------------------');
  console.log('Please provide the following information:');

  let userDto = new CreateUserInput();
  userDto.firstname = await askQuestion('Enter your first name: ');
  userDto.lastname = await askQuestion('Enter your last name: ');
  userDto.email = await askQuestion('Enter your email: ');
  userDto.phone = await askQuestion('Enter your phone number: ');

  // validate user
  const errors = await validate(userDto);
  if (errors.length > 0) {
    console.log('Validation failed. Errors:');
    console.log(errors.map((e) => e.constraints));
    return;
  }

  // transform phone number
  userDto = instanceToInstance(userDto);

  try {
    console.log();

    const regionsServie = app.get(RegionsService);

    let adminRegion = await regionsServie.findOneByName('Administrators');
    if (!adminRegion) {
      adminRegion = await regionsServie.create({
        name: 'Administrators',
      });
      console.log('Region created successfully! ');
    } else {
      console.log('Region already exists! ');
    }
    userDto.regionId = adminRegion.id;

    const usersService = app.get(UsersService);
    const permissionsService = app.get(PermissionsService);

    const user = await usersService.create(userDto);
    await permissionsService.addRoleToUser(user.id, Role.Admin);

    console.log(
      `User created successfully!\nMail with credentials sent to ${user.email}!`,
    );
  } catch (e) {
    console.log();
    console.log('-----------');
    console.log('-- Error --');
    console.log('-----------');
    console.log(e.message);
  }
}
