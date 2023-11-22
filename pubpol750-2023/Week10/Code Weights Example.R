df <- df |>
  mutate(vote=coalesce(q12,q11),
         vote=as_factor(vote),
         gender=as_factor(q3))

(to_plot <- df |>
    filter(gender %in% c("(1) Male", "(2) Female")) |>
    as_survey_design(ids = 1, weight = weight_CES) |>
    group_by(gender,vote)|>
    summarise(survey_mean()))

to_plot |>
  ggplot(aes(x=vote,y=coef, fill=vote)) +
  facet_wrap(~gender) +
  geom_bar(stat="identity") +
  coord_flip()
