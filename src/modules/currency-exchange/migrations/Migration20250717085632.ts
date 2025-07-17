import { Migration } from '@mikro-orm/migrations';

export class Migration20250717085632 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "currency_exchange_settings" ("id" text not null, "currency_code" text not null, "exchange_rate" real not null default 1, "mode" text check ("mode" in ('auto', 'manual')) not null default 'auto', "status" text check ("status" in ('enable', 'disable')) not null default 'disable', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "currency_exchange_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_currency_exchange_settings_deleted_at" ON "currency_exchange_settings" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "currency_exchange_settings" cascade;`);
  }

}
