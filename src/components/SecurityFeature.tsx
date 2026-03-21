import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SecurityFeatureProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

const SecurityFeature = ({ icon: Icon, title, description, delay = 0 }: SecurityFeatureProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="group relative bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 border border-border"
  >
    <div className="w-12 h-12 rounded-lg bg-gradient-medical flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-primary-foreground" />
    </div>
    <h3 className="font-display font-semibold text-lg mb-2 text-card-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </motion.div>
);

export default SecurityFeature;
