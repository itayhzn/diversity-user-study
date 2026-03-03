#!/usr/bin/env python3
"""Generate config.json from the images/ directory structure.

Expected structure:
  images/
    experiment_{name}/
      model_{model_name}/
        prompt_{id}/
          prompt.txt
          img_0.png
          img_1.png
          ...

Usage:
  python scripts/generate_config.py
  python scripts/generate_config.py --images-dir images --output config.json
  python scripts/generate_config.py --metrics-file metrics.json
"""

import argparse
import json
import os
import sys


DEFAULT_METRICS = [
    {"id": "quality", "label": "Image Quality", "question": "Which set has higher visual quality?"},
    {"id": "alignment", "label": "Prompt Alignment", "question": "Which set better matches the prompt?"},
    {"id": "diversity", "label": "Diversity", "question": "Which set shows more variety?"},
]


def discover_experiments(images_dir):
    """Return sorted list of experiment directory names (the full dir name, e.g. 'experiment_cfg1')."""
    experiments = sorted(
        d for d in os.listdir(images_dir)
        if os.path.isdir(os.path.join(images_dir, d)) and d.startswith("experiment_")
    )
    if not experiments:
        print(f"Error: No experiment_* directories found in {images_dir}", file=sys.stderr)
        sys.exit(1)
    return experiments


def discover_models_in_experiment(exp_full_path):
    """Return sorted list of model directory names inside an experiment directory."""
    models = sorted(
        d for d in os.listdir(exp_full_path)
        if os.path.isdir(os.path.join(exp_full_path, d)) and not d.startswith(".")
    )
    if len(models) < 2:
        print(f"Error: Expected at least 2 model directories in {exp_full_path}, found {len(models)}", file=sys.stderr)
        sys.exit(1)
    return models


def discover_prompts_in_experiment(exp_full_path, models):
    """Discover prompts inside an experiment directory (same logic as legacy discover_prompts)."""
    first_model_dir = os.path.join(exp_full_path, models[0])
    prompt_ids = sorted(
        d for d in os.listdir(first_model_dir)
        if os.path.isdir(os.path.join(first_model_dir, d)) and d.startswith("prompt_")
    )

    prompts = []
    for pid in prompt_ids:
        # Read prompt text
        prompt_text = pid  # fallback
        for model in models:
            txt_path = os.path.join(exp_full_path, model, pid, "prompt.txt")
            if os.path.exists(txt_path):
                with open(txt_path) as f:
                    prompt_text = f.read().strip()
                break

        # Count images from first model
        img_dir = os.path.join(exp_full_path, models[0], pid)
        image_files = sorted(
            f for f in os.listdir(img_dir)
            if f.startswith("img_") and f.endswith(".png")
        )
        count = len(image_files)

        # Validate all models have the same count
        for model in models[1:]:
            model_img_dir = os.path.join(exp_full_path, model, pid)
            if not os.path.isdir(model_img_dir):
                print(f"Warning: {model_img_dir} does not exist", file=sys.stderr)
                continue
            model_images = [f for f in os.listdir(model_img_dir) if f.startswith("img_") and f.endswith(".png")]
            if len(model_images) != count:
                print(f"Warning: {model}/{pid} has {len(model_images)} images, expected {count}", file=sys.stderr)

        prompts.append({"id": pid, "text": prompt_text, "images_per_model": count})

    return prompts


def main():
    parser = argparse.ArgumentParser(description="Generate config.json from images directory")
    parser.add_argument("--images-dir", default="images", help="Path to images directory")
    parser.add_argument("--output", default="config.json", help="Output config file path")
    parser.add_argument("--metrics-file", help="JSON file with custom metrics array")
    args = parser.parse_args()

    if not os.path.isdir(args.images_dir):
        print(f"Error: Images directory '{args.images_dir}' not found", file=sys.stderr)
        sys.exit(1)

    experiment_dirs = discover_experiments(args.images_dir)

    experiments = []
    total_prompts = 0
    for exp_dir in experiment_dirs:
        exp_id = exp_dir[len("experiment_"):]  # strip "experiment_" prefix
        exp_full_path = os.path.join(args.images_dir, exp_dir)
        models = discover_models_in_experiment(exp_full_path)
        prompts = discover_prompts_in_experiment(exp_full_path, models)
        if not prompts:
            print(f"Warning: No prompts found in experiment '{exp_id}'", file=sys.stderr)
        experiments.append({"id": exp_id, "models": models, "prompts": prompts})
        total_prompts += len(prompts)

    if total_prompts == 0:
        print("Error: No prompts discovered across any experiments", file=sys.stderr)
        sys.exit(1)

    metrics = DEFAULT_METRICS
    if args.metrics_file:
        with open(args.metrics_file) as f:
            metrics = json.load(f)

    # Preserve existing googleAppsScriptUrl if config already exists
    existing_url = ""
    if os.path.exists(args.output):
        try:
            with open(args.output) as f:
                existing = json.load(f)
                existing_url = existing.get("googleAppsScriptUrl", "")
        except (json.JSONDecodeError, IOError):
            pass

    config = {
        "study": {
            "title": "Image Generation Diversity Study",
            "description": "Help us evaluate the diversity of AI-generated images. Your responses will contribute to research on improving image generation models.",
            "instructions": "For each prompt, you will see two sets of images generated by different models. Compare the sets and rate them on each metric. There are no right or wrong answers — we want your honest impression.",
        },
        "experiments": experiments,
        "metrics": metrics,
        "images_base_path": args.images_dir,
        "googleAppsScriptUrl": existing_url,
    }

    with open(args.output, "w") as f:
        json.dump(config, f, indent=2)

    print(f"Generated {args.output} with {len(experiments)} experiments, {total_prompts} total prompts")


if __name__ == "__main__":
    main()
