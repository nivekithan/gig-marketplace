import { FieldConfig, conform } from "@conform-to/react";
import { InputErrors, InputField } from "./inputField";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import Select, { MultiValue } from "react-select";
import { ValidGigSkills, validSkills } from "~/models/skills";

export type GigCreateOrEditFields = {
  name: FieldConfig<string>;
  description: FieldConfig<string>;
  price: FieldConfig<number>;
  skills: FieldConfig<ValidGigSkills[]>;

  defaultName?: string;
  defaultDescription?: string;
  defaultPrice?: number;
  defaultSkills?: ValidGigSkills[];
};

export function GigCreateOrEditFields({
  description,
  name,
  price,
  skills,

  defaultDescription,
  defaultName,
  defaultPrice,
  defaultSkills,
}: GigCreateOrEditFields) {
  return (
    <>
      <InputField>
        <Label>Gig Name:</Label>
        <Input {...conform.input(name)} defaultValue={defaultName} />
        <InputErrors errors={name.errors} />
      </InputField>
      <InputField>
        <Label>Gig Description:</Label>
        <Input
          {...conform.input(description)}
          defaultValue={defaultDescription}
        />
        <InputErrors errors={description.errors} />
      </InputField>
      <InputField>
        <Label>Price in USD:</Label>
        <Input
          {...conform.input(price)}
          className="max-w-[120px] min-w-[0px]"
          defaultValue={defaultPrice}
        />
        <InputErrors errors={price.errors} />
      </InputField>
      <SkillMultiSelect
        skills={skills}
        defaultValue={defaultSkills ? defaultSkills : []}
      />
    </>
  );
}

function SkillMultiSelect({
  skills,
  defaultValue,
}: {
  skills: FieldConfig<ValidGigSkills[]>;
  defaultValue: Readonly<ValidGigSkills[]>;
}) {
  const [selectedSkills, setSelectedSkills] = useState<MultiValue<{
    label: string;
    value: string;
  }> | null>(() =>
    defaultValue.length
      ? defaultValue.map((skill) => ({ label: skill, value: skill }))
      : null,
  );

  console.log({ selectedSkills, defaultValue });

  return (
    <div>
      <Label>Select Skills:</Label>
      <Select
        isMulti
        options={validSkills.map((skill) => {
          return { label: skill, value: skill };
        })}
        onChange={setSelectedSkills}
        defaultValue={selectedSkills}
        name="unknown"
      />
      <div>
        {selectedSkills?.map(({ value }, i) => {
          return (
            <input name={`${skills.name}[${i}]`} defaultValue={value} hidden />
          );
        })}
      </div>
    </div>
  );
}
