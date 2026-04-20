import { Module } from '@nestjs/common';

// The roles system is implemented via decorators and guards in common/
// This module exists as a logical grouping and can be expanded with
// a roles management API if dynamic role assignment is needed.
@Module({})
export class RolesModule {}
