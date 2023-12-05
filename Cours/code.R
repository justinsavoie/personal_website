library(tidyverse)
library(haven)
df <- read_stata("~/Downloads/DC 2021 v1 (1).dta")
labels_ <- c("Les tribunaux","Le gouvernement fédéral","Les médias","Votre gouvernement provincial","Élections Canada")
to_plot <- df |>
  select(all_of(paste0("dc21_confidence_inst_",1:5))) |>
  gather(key,value) |> 
  mutate(key=factor(key,labels=c(labels_))) |>
  group_by(key) |>
  summarise(v=mean(value<3))
to_plot |>
  ggplot(aes(x=key,y=v, label=paste0(100*round(v,2),"%"))) +
  geom_bar(stat='identity',fill="black") +
  coord_flip() +
  theme_bw() + geom_text(hjust=-0.5) +
  scale_y_continuous(limits=c(0,1), labels=function(x){paste0(x*100,"%")}) +
  labs(y="% qui ont beaucoup ou assez confiance",x="", 
       title="Quel niveau de confiance accordez-vous\naux institutions suivantes?")
