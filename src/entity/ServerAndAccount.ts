import {
  Entity,
  Column,
  ManyToOne,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm'
import { ExpoToken } from './ExpoToken'

@Entity()
@Index(['expoToken', 'serverKey', 'instanceUrl', 'accountId'], { unique: true })
export class ServerAndAccount {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(
    () => ExpoToken,
    expoToken => expoToken.expoToken
  )
  expoToken!: ExpoToken

  @Column({ nullable: true }) // Nullable only during register1
  serverKey?: string

  @Column({ type: 'jsonb', nullable: true }) // Nullable when disallowing decode
  keys?: { auth: string; public: string; private: string }

  @Column()
  instanceUrl!: string

  @Column()
  accountId!: string

  @Column()
  accountFull!: string // Combination of acct and uri, e.g. @tooot@xmflsct.com
}
