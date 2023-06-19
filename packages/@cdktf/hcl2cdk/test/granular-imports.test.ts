// Copyright (c) HashiCorp, Inc
// SPDX-License-Identifier: MPL-2.0
import { testCase, Synth, binding } from "./helpers/convert";

describe("granular-imports", () => {
  testCase.test(
    "nested sub-structs",
    `
resource "kubernetes_deployment" "example" {
  metadata {
    name = "terraform-example"
    labels = {
      test = "MyExampleApp"
    }
  }

  spec {
    replicas = 3

    selector {
      match_labels = {
        test = "MyExampleApp"
      }
    }

    template {
      metadata {
        labels = {
          test = "MyExampleApp"
        }
      }

      spec {
        container {
          image = "nginx:1.21.6"
          name  = "example"

          resources {
            limits = {
              cpu    = "0.5"
              memory = "512Mi"
            }
            requests = {
              cpu    = "250m"
              memory = "50Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 80

              http_header {
                name  = "X-Custom-Header"
                value = "Awesome"
              }
            }

            initial_delay_seconds = 3
            period_seconds        = 3
          }
        }
      }
    }
  }
}
`,
    [binding.kubernetes],
    Synth.yes_all_languages,
    {
      resources: ["kubernetes_deployment"],
    }
  );

  // testCase.test(
  //   "should handle most cdktf and provider constructs for granular imports",
  //   `
  //   provider "google" {
  //     project = "my-project"
  //     region  = "us-central1"
  //   }
  //
  //   provider "local" {}
  //
  //   resource "google_compute_autoscaler" "example" {
  //     name   = "example-autoscaler"
  //     zone   = "us-east1-b"
  //     target = "target-for-example-autoscaler"
  //     count = 2
  //
  //     autoscaling_policy = {
  //       max_replicas    = 8
  //       min_replicas    = 2
  //       cooldown_period = 60
  //
  //       cpu_utilization = {
  //         target = 0.5
  //       }
  //     }
  //   }
  //
  //   resource "google_compute_instance_group_manager" "default" {
  //     name = "my-igm"
  //     zone = "us-central1-f"
  //
  //     version {
  //       instance_template = 1
  //       name              = "primary"
  //     }
  //
  //     target_pools       = []
  //     base_instance_name = "autoscaler-sample"
  //   }
  //
  //   resource "google_compute_autoscaler" "default" {
  //     name   = "my-autoscaler"
  //     zone   = "us-central1-f"
  //     target = google_compute_instance_group_manager.default.id
  //
  //     autoscaling_policy {
  //       max_replicas    = 5 + 2
  //       min_replicas    = 1
  //       cooldown_period = 60
  //
  //       metric {
  //         name                       = "pubsub.googleapis.com/subscription/num_undelivered_messages"
  //         filter                     = "resource.type = pubsub_subscription AND resource.label.subscription_id = our-subscription"
  //         single_instance_assignment = 65535
  //       }
  //     }
  //   }
  //
  //   variable "image_id" {
  //     type = string
  //   }
  //
  //   output "image_id" {
  //     value = var.image_id
  //   }
  //
  //   data "local_file" "foo" {
  //     filename = "./\${var.image_id}.img"
  //   }
  //   `,
  //   [binding.google, binding.local],
  //   Synth.yes,
  //   {
  //     resources: ["google_compute_autoscaler", "local_file"],
  //   }
  // );
});
