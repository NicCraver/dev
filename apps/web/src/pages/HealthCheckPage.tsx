import { motion } from "motion/react";

import { HealthCheck } from "@/components/HealthCheck";

export function HealthCheckPage() {
  return (
    <motion.div
      className="bg-background text-foreground flex min-h-svh flex-col p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <HealthCheck />
    </motion.div>
  );
}
