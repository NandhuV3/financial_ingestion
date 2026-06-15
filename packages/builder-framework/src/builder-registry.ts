import type { Builder, BuilderFactory } from "./builder.js";
import type { BuilderDefinition } from "./builder-definition.js";
import { BuilderDependencyError } from "./builder-errors.js";
import { validateBuilderDefinition } from "./builder-validator.js";

type BuilderRegistration = {
  definition: BuilderDefinition;
  factory: BuilderFactory;
};

export class BuilderRegistry {
  private readonly registrations = new Map<string, BuilderRegistration>();

  registerBuilder<TInput, TOutput>(
    definition: BuilderDefinition,
    factory: BuilderFactory<TInput, TOutput>,
  ): void {
    validateBuilderDefinition(definition);

    if (this.registrations.has(definition.builder_type)) {
      throw new BuilderDependencyError(`Builder already registered: ${definition.builder_type}`);
    }

    this.registrations.set(definition.builder_type, {
      definition,
      factory: factory as BuilderFactory,
    });
  }

  getBuilderDefinition(builderType: string): BuilderDefinition {
    const registration = this.registrations.get(builderType);

    if (!registration) {
      throw new BuilderDependencyError(`Builder not registered: ${builderType}`);
    }

    return registration.definition;
  }

  getBuilder<TInput, TOutput>(builderType: string): Builder<TInput, TOutput> {
    const registration = this.registrations.get(builderType);

    if (!registration) {
      throw new BuilderDependencyError(`Builder not registered: ${builderType}`);
    }

    const builder = registration.factory() as Builder<TInput, TOutput>;

    if (builder.builderType() !== registration.definition.builder_type) {
      throw new BuilderDependencyError(
        `Builder factory returned ${builder.builderType()} for registered builder ${registration.definition.builder_type}`,
      );
    }

    return builder;
  }

  listBuilders(): BuilderDefinition[] {
    return [...this.registrations.values()]
      .map((registration) => registration.definition)
      .sort((left, right) => left.builder_type.localeCompare(right.builder_type));
  }
}

