import { TaxonomySelect } from "./taxonomy-select";
import { ScoreSelect } from "./score-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  JTBD_OPTIONS,
  ACQUISITION_SOURCE_OPTIONS,
  PERCEPTION_OPTIONS,
  FEATURE_AWARENESS_OPTIONS,
  YES_NO_PARTIALLY_OPTIONS,
  COORDINATION_SUCCESS_OPTIONS,
  MARKETPLACE_CONFIDENCE_OPTIONS,
  CROSS_JTBD_RETURN_OPTIONS,
  BIGGEST_FRICTION_OPTIONS,
  MISSING_CAPABILITY_OPTIONS,
} from "@/lib/research/taxonomy-options";

export interface InterviewFormValues {
  jtbd: string;
  acquisition_source: string;
  initial_perception: string;
  current_perception: string;
  feature_awareness: string;
  activation: string;
  problem_solved: string;
  coordination_success: string;
  marketplace_confidence: string;
  trust_score?: number;
  exp_match_score?: number;
  return_intent_score?: number;
  cross_jtbd_return: string;
  biggest_friction: string;
  missing_capability: string;
  raw_notes: string;
}

export const EMPTY_INTERVIEW_FORM: InterviewFormValues = {
  jtbd: "",
  acquisition_source: "",
  initial_perception: "",
  current_perception: "",
  feature_awareness: "",
  activation: "",
  problem_solved: "",
  coordination_success: "",
  marketplace_confidence: "",
  trust_score: undefined,
  exp_match_score: undefined,
  return_intent_score: undefined,
  cross_jtbd_return: "",
  biggest_friction: "",
  missing_capability: "",
  raw_notes: "",
};

export function InterviewFormFields({
  values,
  onChange,
}: {
  values: InterviewFormValues;
  onChange: (patch: Partial<InterviewFormValues>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TaxonomySelect
          id="jtbd"
          label="JTBD — why did they come?"
          options={JTBD_OPTIONS}
          value={values.jtbd}
          onChange={(v) => onChange({ jtbd: v })}
        />
        <TaxonomySelect
          id="acquisition_source"
          label="Acquisition source"
          options={ACQUISITION_SOURCE_OPTIONS}
          value={values.acquisition_source}
          onChange={(v) => onChange({ acquisition_source: v })}
        />
        <TaxonomySelect
          id="initial_perception"
          label="Initial perception"
          options={PERCEPTION_OPTIONS}
          value={values.initial_perception}
          onChange={(v) => onChange({ initial_perception: v })}
        />
        <TaxonomySelect
          id="current_perception"
          label="Current perception"
          options={PERCEPTION_OPTIONS}
          value={values.current_perception}
          onChange={(v) => onChange({ current_perception: v })}
        />
        <TaxonomySelect
          id="feature_awareness"
          label="Feature awareness"
          options={FEATURE_AWARENESS_OPTIONS}
          value={values.feature_awareness}
          onChange={(v) => onChange({ feature_awareness: v })}
        />
        <TaxonomySelect
          id="activation"
          label="Activation (used core feature?)"
          options={YES_NO_PARTIALLY_OPTIONS}
          value={values.activation}
          onChange={(v) => onChange({ activation: v })}
        />
        <TaxonomySelect
          id="problem_solved"
          label="Problem solved?"
          options={YES_NO_PARTIALLY_OPTIONS}
          value={values.problem_solved}
          onChange={(v) => onChange({ problem_solved: v })}
        />
        <TaxonomySelect
          id="coordination_success"
          label="Coordination success"
          options={COORDINATION_SUCCESS_OPTIONS}
          value={values.coordination_success}
          onChange={(v) => onChange({ coordination_success: v })}
        />
        <TaxonomySelect
          id="marketplace_confidence"
          label="Marketplace confidence"
          options={MARKETPLACE_CONFIDENCE_OPTIONS}
          value={values.marketplace_confidence}
          onChange={(v) => onChange({ marketplace_confidence: v })}
        />
        <TaxonomySelect
          id="cross_jtbd_return"
          label="Cross-JTBD return intent"
          options={CROSS_JTBD_RETURN_OPTIONS}
          value={values.cross_jtbd_return}
          onChange={(v) => onChange({ cross_jtbd_return: v })}
        />
        <TaxonomySelect
          id="biggest_friction"
          label="Biggest friction"
          options={BIGGEST_FRICTION_OPTIONS}
          value={values.biggest_friction}
          onChange={(v) => onChange({ biggest_friction: v })}
        />
        <TaxonomySelect
          id="missing_capability"
          label="Missing capability"
          options={MISSING_CAPABILITY_OPTIONS}
          value={values.missing_capability}
          onChange={(v) => onChange({ missing_capability: v })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreSelect
          id="trust_score"
          label="Trust (1–5)"
          value={values.trust_score}
          onChange={(v) => onChange({ trust_score: v })}
        />
        <ScoreSelect
          id="exp_match_score"
          label="Expectation match (1–5)"
          value={values.exp_match_score}
          onChange={(v) => onChange({ exp_match_score: v })}
        />
        <ScoreSelect
          id="return_intent_score"
          label="Return intent (1–5)"
          value={values.return_intent_score}
          onChange={(v) => onChange({ return_intent_score: v })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="raw_notes">Raw notes</Label>
        <Textarea
          id="raw_notes"
          rows={3}
          value={values.raw_notes}
          onChange={(e) => onChange({ raw_notes: e.target.value })}
        />
      </div>
    </div>
  );
}
