library(tidyverse)
library(haven)
library(srvyr)

df <- read_stata("~/Downloads/DC 2021 v1.dta")

df$Province <- recode(df$Province,
                      "Alberta1"="AB","British Columbia2"="BC", "Colombie-Britannique2"="BC", "Manitoba3"="MB", 
                      "New Brunswick4"="NB", "Newfoundland and Labrador5"="NFL", "Nouveau-Brunswick4"="NB", 
                      "Nova Scotia7"="NS", "Ontario9"="ON", "Prince Edward Island10"="PEI", "Quebec11"="QC", 
                      "Québec11"="QC", "Saskatchewan12"="SK")

to_save <- df |>
  filter(dc21_confidence_inst_1!=-99) |>
  mutate(dc21_confidence_inst_1=as_factor(dc21_confidence_inst_1)) |>
  select(dc21_confidence_inst_1,Province,weight=dc21_quota_weight) |>
  as_survey_design(ids = 1, weight = weight) |>
  group_by(Province,dc21_confidence_inst_1) |>
  summarise(survey_mean()) |>
  select(-`_se`) |>
  mutate(coef=round(coef,2))
  pivot_wider(names_from=dc21_confidence_inst_1,values_from=coef)

write_csv(to_save,"~/Desktop/data_figure.csv")

make_csv_figure <- function(var,out){
  to_save <- df |>
    rename(my_var = !!sym(var)) |>
    filter(my_var!=-99) |>
    mutate(my_var=as_factor(my_var)) |>
    select(my_var,Province,weight=dc21_quota_weight) |>
    as_survey_design(ids = 1, weight = weight) |>
    group_by(Province,my_var) |>
    summarise(survey_mean()) |>
    select(-`_se`) |>
    mutate(coef=round(coef,2)) |>
    pivot_wider(names_from=my_var,values_from=coef)
  
  write_csv(to_save,out) 
}
make_csv_figure(var="dc21_confidence_inst_1",
                out="~/Desktop/data_figure.csv")
make_csv_figure(var="dc21_confidence_inst_2",
                out="~/Desktop/data_figure2.csv")


