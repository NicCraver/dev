import { ConstructionIcon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

type ComingSoonProps = {
  title: string;
  description?: string;
};

export function ComingSoon({ title, description = "开发中，敬请期待" }: ComingSoonProps) {
  return (
    <motion.div
      className="flex flex-1 items-center justify-center p-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <Icon icon={ConstructionIcon} className="text-muted-foreground mb-2 size-10" />
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
