import "reflect-metadata";
import { Column, Entity } from "typeorm";
import BaseTable from "./BaseTable.ts";
import { ThemeType } from "../config/constants.ts";

export
@Entity("themes")
class Theme extends BaseTable {
  @Column({ type: "simple-json", nullable: true, default: "{}" })
  theme!: any;

  @Column({
    type: "simple-enum",
    enum: ThemeType,
    default: ThemeType.PRESET,
  })
  themeType!: (typeof ThemeType)[keyof typeof ThemeType];

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId!: string;
}
