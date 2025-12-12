"use client";

import type React from "react";

import { useState } from "react";
import type { CompanyUpsertPayload, UICompany } from "@/lib/types";
import type { PersonaRole } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PillInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  prefix?: string;
}

function PillInput({
  label,
  values,
  onChange,
  placeholder,
  prefix,
}: PillInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onChange([...values, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((value, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm"
          >
            {prefix}
            {value}
            <button
              onClick={() => handleRemove(index)}
              className="ml-1 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="rounded-md"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="rounded-md bg-transparent"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface PersonaCardProps {
  persona: CompanyUpsertPayload["personas"][number];
  onUpdate: (persona: CompanyUpsertPayload["personas"][number]) => void;
  onDelete: () => void;
}

function PersonaCard({ persona, onUpdate, onDelete }: PersonaCardProps) {
  return (
    <div className="p-4 border border-border rounded-xl space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {persona.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Input
              value={persona.username}
              onChange={(e) =>
                onUpdate({ ...persona, username: e.target.value })
              }
              className="h-8 font-medium border-0 p-0 focus-visible:ring-0"
              placeholder="Username *"
              required
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Personality
          </Label>
          <Select
            value={persona.personality ?? "professional"}
            onValueChange={(value: string) =>
              onUpdate({ ...persona, personality: value })
            }
          >
            <SelectTrigger className="rounded-md w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Writing Style
          </Label>
          <Select
            value={persona.writing_style ?? "conversational"}
            onValueChange={(value: string) =>
              onUpdate({ ...persona, writing_style: value })
            }
          >
            <SelectTrigger className="rounded-md w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="conversational">Conversational</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="persuasive">Persuasive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <PillInput
        label="Expertise Tags"
        values={persona.expertise_areas ?? []}
        onChange={(tags) => onUpdate({ ...persona, expertise_areas: tags })}
        placeholder="Add expertise..."
      />
    </div>
  );
}

interface CompanyFormProps {
  company?: UICompany;
  onSave: (company: CompanyUpsertPayload) => void;
}

export function CompanyForm({ company, onSave }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    name: company?.name || "",
    description: company?.description || "",
    website_url: company?.website_url || "",
    value_props: company?.value_props || [],
    pain_points: company?.pain_points || [],
    posts_per_week: company?.posts_per_week ?? 3,
    personas:
      company?.personas?.map((p) => ({
        username: p.username,
        role: "poster" as PersonaRole,
        personality: p.personality ?? "professional",
        writing_style: p.writingStyle ?? "conversational",
        expertise_areas: [],
      })) || [],
    subreddits: company?.subreddits?.map((s) => s.name) || [],
  });

  const addPersona = () => {
    const newPersona: CompanyUpsertPayload["personas"][number] = {
      username: "",
      role: "poster",
      personality: "professional",
      writing_style: "conversational",
      expertise_areas: [],
    };
    setFormData({ ...formData, personas: [...formData.personas, newPersona] });
  };

  const updatePersona = (
    index: number,
    persona: CompanyUpsertPayload["personas"][number]
  ) => {
    const newPersonas = [...formData.personas];
    newPersonas[index] = persona;
    setFormData({ ...formData, personas: newPersonas });
  };

  const deletePersona = (index: number) => {
    setFormData({
      ...formData,
      personas: formData.personas.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Company description is required");
      return;
    }
    if (formData.personas.length < 2) {
      toast.error("At least 2 personas are required");
      return;
    }
    if (formData.personas.some((p) => !p.username.trim())) {
      toast.error("All personas must have a username");
      return;
    }
    if (formData.subreddits.length < 1) {
      toast.error("At least 1 subreddit is required");
      return;
    }

    onSave({
      name: formData.name,
      description: formData.description,
      website_url: formData.website_url || undefined,
      value_props: formData.value_props,
      pain_points: formData.pain_points,
      posts_per_week: formData.posts_per_week,
      personas: formData.personas,
      subreddits: formData.subreddits,
    });
    toast.success(
      company ? "Company updated successfully" : "Company created successfully"
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <section className="bg-card rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm text-muted-foreground">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter company name"
              className="rounded-md mt-1"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="description"
              className="text-sm text-muted-foreground"
            >
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of your company..."
              className="rounded-md mt-1 resize-none"
              rows={3}
              required
            />
          </div>
          <div>
            <Label
              htmlFor="website_url"
              className="text-sm text-muted-foreground"
            >
              Website URL
            </Label>
            <Input
              id="website_url"
              value={formData.website_url}
              onChange={(e) =>
                setFormData({ ...formData, website_url: e.target.value })
              }
              placeholder="https://example.com"
              className="rounded-md mt-1"
            />
          </div>
        </div>
      </section>

      {/* Value Props & Pain Points */}
      <section className="bg-card rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          Value Propositions & Pain Points
        </h2>
        <div className="space-y-6">
          <PillInput
            label="Value Propositions"
            values={formData.value_props}
            onChange={(values) =>
              setFormData({ ...formData, value_props: values })
            }
            placeholder="Add a value proposition..."
          />
          <PillInput
            label="Pain Points Solved"
            values={formData.pain_points}
            onChange={(values) =>
              setFormData({ ...formData, pain_points: values })
            }
            placeholder="Add a pain point..."
          />
        </div>
      </section>

      {/* Personas */}
      <section className="bg-card rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Personas{" "}
            <span className="text-red-500 text-sm font-normal">
              (min. 2 required)
            </span>
          </h2>
          <Button
            type="button"
            variant="outline"
            onClick={addPersona}
            className="rounded-md bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Persona
          </Button>
        </div>
        <div className="space-y-4">
          {formData.personas.map((persona, index) => (
            <PersonaCard
              key={persona.id ?? `new-persona-${index}`}
              persona={persona}
              onUpdate={(p) => updatePersona(index, p)}
              onDelete={() => deletePersona(index)}
            />
          ))}
          {formData.personas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No personas yet. Add one to get started.
            </div>
          )}
        </div>
      </section>

      {/* Subreddits */}
      <section className="bg-card rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          Target Subreddits{" "}
          <span className="text-red-500 text-sm font-normal">
            (min. 1 required)
          </span>
        </h2>
        <PillInput
          label="Subreddits"
          values={formData.subreddits}
          onChange={(values) =>
            setFormData({ ...formData, subreddits: values })
          }
          placeholder="Add subreddit (without r/)"
          prefix="r/"
        />
      </section>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-md bg-transparent"
        >
          Cancel
        </Button>
        <Button type="submit" className="rounded-md">
          {company ? "Update Company" : "Create Company"}
        </Button>
      </div>
    </form>
  );
}
